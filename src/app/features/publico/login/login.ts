import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideCircleAlert, LucideLoaderCircle } from '@lucide/icons';
import { iconos } from '../../../shared/iconos';
import { aplicarErroresApi } from '../../../core/api/api-error';
import { AuthService } from '../../../core/auth/auth-service';
import { inicioPorRol } from '../../../core/auth/inicio-por-rol';
import { primerNombre } from '../../../core/auth/rol';
import { ToastService } from '../../../core/ui/toast-service';
import { MensajesDeError, mensajeDeError, redirectSeguro } from '../../../shared/forms/errores';

type Campo = 'email' | 'password';

const MENSAJES: Record<Campo, MensajesDeError> = {
  email: {
    required: 'Escribe tu correo.',
    email: 'Escribe un correo válido, como nombre@correo.com.',
  },
  password: {
    required: 'Escribe tu contraseña.',
    maxlength: 'La contraseña puede tener hasta 72 caracteres.',
  },
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, LucideDynamicIcon],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly iconos = iconos({ LucideCircleAlert, LucideLoaderCircle });

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Query param `?redirect=`: ruta a la que se vuelve después de iniciar sesión. */
  readonly redirect = input<string>();

  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });

  protected errorDe(campo: Campo): string | null {
    return mensajeDeError(this.formulario.controls[campo], MENSAJES[campo]);
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
        this.toast.exito(`¡Hola de nuevo, ${primerNombre(perfil.nombre)}!`);
        void this.router.navigateByUrl(redirectSeguro(this.redirect()) ?? inicioPorRol(perfil.rol));
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
}
