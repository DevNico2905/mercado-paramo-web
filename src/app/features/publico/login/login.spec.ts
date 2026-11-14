import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { authInterceptor } from '../../../core/auth/auth-interceptor';
import { errorInterceptor } from '../../../core/auth/error-interceptor';
import { Login } from './login';

describe('Login: límites de entrada y errores del API', () => {
  let fixture: ComponentFixture<Login>;

  const formulario = (): FormGroup =>
    fixture.debugElement.query(By.directive(FormGroupDirective)).injector.get(FormGroupDirective)
      .form;

  function escribir(selector: string, valor: string) {
    const campo = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector);
    if (!campo) {
      throw new Error(`No existe ${selector}`);
    }
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    campo.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  const texto = () => (fixture.nativeElement as HTMLElement).textContent.replace(/\s+/g, ' ');

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('password de 73 caracteres es inválida y no se envía', () => {
    // Sin renderizar la plantilla: solo el validator del FormControl, no el del atributo.
    const sinPlantilla = (
      TestBed.createComponent(Login).componentInstance as unknown as { formulario: FormGroup }
    ).formulario.controls['password'];
    sinPlantilla.setValue('a'.repeat(73));
    expect(sinPlantilla.errors?.['maxlength']).toBeTruthy();

    escribir('#login-email', 'a@b.co');
    escribir('#login-password', 'a'.repeat(73));

    const password = formulario().controls['password'];
    expect(password.invalid).toBe(true);
    expect(password.errors?.['maxlength']).toBeTruthy();
    expect(texto()).toContain('La contraseña puede tener hasta 72 caracteres.');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('#login-password')
        ?.getAttribute('maxlength'),
    ).toBe('72');

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')?.click();
    TestBed.inject(HttpTestingController).expectNone(`${environment.apiUrl}/api/auth/login`);
  });

  it('un 429 muestra el mensaje del backend en la página', () => {
    escribir('#login-email', 'a@b.co');
    escribir('#login-password', 'secreto123');
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')?.click();

    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiUrl}/api/auth/login`)
      .flush(
        { message: 'Demasiados intentos. Intenta de nuevo en 30 segundos', errores: {} },
        { status: 429, statusText: 'Too Many Requests' },
      );
    fixture.detectChanges();

    const alerta = (fixture.nativeElement as HTMLElement).querySelector('[role=alert]');
    expect(alerta?.textContent).toContain('Demasiados intentos. Intenta de nuevo en 30 segundos');
  });
});
