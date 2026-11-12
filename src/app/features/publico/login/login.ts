import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideCircleAlert, LucideLoaderCircle } from '@lucide/angular';
import { aplicarErroresApi } from '../../../core/api/api-error';
import { AuthService } from '../../../core/auth/auth-service';
import { inicioPorRol } from '../../../core/auth/inicio-por-rol';

type Campo = 'email' | 'password';

const MENSAJES: Record<Campo, Record<string, string>> = {
  email: {
    required: 'Escribe tu correo.',
    email: 'Escribe un correo válido, como nombre@correo.com.',
  },
  password: {
    required: 'Escribe tu contraseña.',
  },
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, LucideCircleAlert, LucideLoaderCircle],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Query param `?redirect=`: ruta a la que se vuelve después de iniciar sesión. */
  readonly redirect = input<string>();

  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected errorDe(campo: Campo): string | null {
    const control = this.formulario.controls[campo];
    if (!control.touched || !control.errors) {
      return null;
    }
    const errores = control.errors;
    if (typeof errores['servidor'] === 'string') {
      return errores['servidor'];
    }
    const clave = Object.keys(errores).find((error) => error in MENSAJES[campo]);
    return clave ? MENSAJES[campo][clave] : 'Revisa este campo.';
  }

  protected enviar(): void {
    this.errorGeneral.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.auth.login(this.formulario.getRawValue()).subscribe({
      next: (perfil) => {
        void this.router.navigateByUrl(this.destinoSeguro() ?? inicioPorRol(perfil.rol));
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.errorGeneral.set(this.mensajeDe(error));
      },
    });
  }

  private mensajeDe(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No pudimos iniciar tu sesión. Intenta de nuevo.';
    }
    if (error.status === 401) {
      return 'Correo o contraseña incorrectos';
    }
    if (error.status === 0 || error.status >= 500 || error.status === 403) {
      return null;
    }
    return aplicarErroresApi(this.formulario, error);
  }

  /** Solo se aceptan rutas internas, para no redirigir a otro sitio. */
  private destinoSeguro(): string | null {
    const destino = this.redirect();
    return destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : null;
  }
}
