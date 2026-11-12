import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideCircleAlert, LucideLoaderCircle } from '@lucide/angular';
import { switchMap } from 'rxjs';
import { aplicarErroresApi } from '../../../core/api/api-error';
import { RegistroRequest } from '../../../core/api/models';
import { AuthService } from '../../../core/auth/auth-service';
import { inicioPorRol } from '../../../core/auth/inicio-por-rol';
import { ToastService } from '../../../core/ui/toast-service';
import { MensajesDeError, mensajeDeError, redirectSeguro } from '../../../shared/forms/errores';
import { fortalezaDe } from './fortaleza';

type RolRegistro = 'COMPRADOR' | 'PRODUCTOR';
type Campo = 'nombre' | 'email' | 'telefono' | 'password' | 'vereda' | 'descripcion';

const MENSAJES: Record<Campo, MensajesDeError> = {
  nombre: { required: 'Escribe tu nombre.' },
  email: {
    required: 'Escribe tu correo.',
    email: 'Escribe un correo válido, como nombre@correo.com.',
  },
  telefono: { required: 'Escribe tu teléfono.' },
  password: {
    required: 'Crea una contraseña.',
    minlength: 'La contraseña debe tener al menos 8 caracteres.',
  },
  vereda: { required: 'Escribe la vereda donde produces.' },
  descripcion: {},
};

@Component({
  selector: 'app-registro',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideArrowLeft,
    LucideCircleAlert,
    LucideLoaderCircle,
  ],
  templateUrl: './registro.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Query param `?redirect=`: ruta a la que se vuelve después de crear la cuenta. */
  readonly redirect = input<string>();

  /** `null` en el paso 1 (elegir rol); con valor, en el paso 2 (datos). */
  protected readonly rol = signal<RolRegistro | null>(null);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    vereda: [''],
    descripcion: [''],
  });

  private readonly password = toSignal(this.formulario.controls.password.valueChanges, {
    initialValue: '',
  });
  protected readonly fortaleza = computed(() => fortalezaDe(this.password()));

  protected elegirRol(rol: RolRegistro): void {
    const { vereda } = this.formulario.controls;
    vereda.setValidators(rol === 'PRODUCTOR' ? [Validators.required] : []);
    vereda.updateValueAndValidity();
    this.errorGeneral.set(null);
    this.rol.set(rol);
  }

  protected volverAlPaso1(): void {
    this.rol.set(null);
  }

  protected errorDe(campo: Campo): string | null {
    return mensajeDeError(this.formulario.controls[campo], MENSAJES[campo]);
  }

  protected enviar(): void {
    const rol = this.rol();
    this.errorGeneral.set(null);
    if (rol === null || this.enviando()) {
      return;
    }
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { nombre, email, telefono, password, vereda, descripcion } =
      this.formulario.getRawValue();
    const datos: RegistroRequest = {
      nombre: nombre.trim(),
      email,
      telefono: telefono.trim(),
      password,
      rol,
    };
    if (rol === 'PRODUCTOR') {
      datos.vereda = vereda.trim();
      if (descripcion.trim()) {
        datos.descripcion = descripcion.trim();
      }
    }

    this.enviando.set(true);
    let cuentaCreada = false;
    this.auth
      .registrar(datos)
      .pipe(
        switchMap(() => {
          cuentaCreada = true;
          return this.auth.login({ email, password });
        }),
      )
      .subscribe({
        next: (perfil) => {
          this.toast.exito(
            rol === 'PRODUCTOR'
              ? '¡Bienvenido! La fundación verificará tu cuenta antes de que puedas publicar.'
              : `¡Bienvenido, ${nombre.trim().split(/\s+/)[0]}! Tu cuenta está lista.`,
          );
          void this.router.navigateByUrl(
            redirectSeguro(this.redirect()) ?? inicioPorRol(perfil.rol),
          );
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          if (cuentaCreada) {
            this.toast.info('Tu cuenta quedó creada. Inicia sesión para continuar.');
            void this.router.navigate(['/login'], { queryParamsHandling: 'preserve' });
            return;
          }
          this.errorGeneral.set(this.mensajeDe(error));
        },
      });
  }

  private mensajeDe(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No pudimos crear tu cuenta. Intenta de nuevo.';
    }
    if (error.status === 409) {
      const email = this.formulario.controls.email;
      email.setErrors({ ...email.errors, servidor: 'Ya existe una cuenta con este correo' });
      email.markAsTouched();
      return null;
    }
    if (error.status === 0 || error.status >= 500 || error.status === 403) {
      return null;
    }
    return aplicarErroresApi(this.formulario, error);
  }
}
