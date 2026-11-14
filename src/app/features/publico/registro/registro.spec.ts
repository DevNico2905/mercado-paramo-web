import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Registro } from './registro';

describe('Registro: límites de entrada', () => {
  function abrir(rol: 'Quiero comprar' | 'Soy productor'): ComponentFixture<Registro> {
    const fixture = TestBed.createComponent(Registro);
    fixture.detectChanges();
    const boton = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) =>
      b.textContent.includes(rol),
    );
    boton?.click();
    fixture.detectChanges();
    return fixture;
  }

  const formulario = (fixture: ComponentFixture<Registro>): FormGroup =>
    fixture.debugElement.query(By.directive(FormGroupDirective)).injector.get(FormGroupDirective)
      .form;

  function escribir(fixture: ComponentFixture<Registro>, selector: string, valor: string) {
    const campo = (fixture.nativeElement as HTMLElement).querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >(selector);
    if (!campo) {
      throw new Error(`No existe ${selector}`);
    }
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    campo.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  /**
   * Formulario del componente SIN renderizar la plantilla: así solo actúan los validators del
   * FormControl, no los que Angular agrega por el atributo `maxlength` del input.
   */
  function sinPlantilla() {
    const registro = TestBed.createComponent(Registro).componentInstance as unknown as {
      formulario: FormGroup;
      elegirRol(rol: 'COMPRADOR' | 'PRODUCTOR'): void;
    };
    return registro;
  }

  const atributo = (fixture: ComponentFixture<Registro>, selector: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(selector)?.getAttribute('maxlength');

  const texto = (fixture: ComponentFixture<Registro>) =>
    (fixture.nativeElement as HTMLElement).textContent.replace(/\s+/g, ' ');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('nombre de 101 caracteres es inválido (maxlength)', () => {
    const control = sinPlantilla().formulario.controls['nombre'];
    control.setValue('a'.repeat(101));
    expect(control.errors?.['maxlength']).toBeTruthy();

    const fixture = abrir('Quiero comprar');
    escribir(fixture, '#registro-nombre', 'a'.repeat(101));

    const nombre = formulario(fixture).controls['nombre'];
    expect(nombre.invalid).toBe(true);
    expect(nombre.errors?.['maxlength']).toBeTruthy();
    expect(texto(fixture)).toContain('El nombre puede tener hasta 100 letras.');
    expect(atributo(fixture, '#registro-nombre')).toBe('100');

    escribir(fixture, '#registro-nombre', 'a'.repeat(100));
    expect(nombre.valid).toBe(true);
  });

  it('password de 73 caracteres es inválida', () => {
    const control = sinPlantilla().formulario.controls['password'];
    control.setValue('a'.repeat(73));
    expect(control.errors?.['maxlength']).toBeTruthy();

    const fixture = abrir('Quiero comprar');
    escribir(fixture, '#registro-password', 'a'.repeat(73));

    const password = formulario(fixture).controls['password'];
    expect(password.invalid).toBe(true);
    expect(password.errors?.['maxlength']).toBeTruthy();
    expect(texto(fixture)).toContain('La contraseña puede tener hasta 72 caracteres.');
    expect(atributo(fixture, '#registro-password')).toBe('72');
  });

  it('descripción de 501 caracteres es inválida y el contador muestra N/500', () => {
    const control = sinPlantilla().formulario.controls['descripcion'];
    control.setValue('a'.repeat(501));
    expect(control.errors?.['maxlength']).toBeTruthy();

    const fixture = abrir('Soy productor');
    expect(texto(fixture)).toContain('0/500');

    escribir(fixture, '#registro-descripcion', 'a'.repeat(501));

    const descripcion = formulario(fixture).controls['descripcion'];
    expect(descripcion.invalid).toBe(true);
    expect(descripcion.errors?.['maxlength']).toBeTruthy();
    expect(texto(fixture)).toContain('501/500');
    expect(texto(fixture)).toContain('La descripción puede tener hasta 500 caracteres.');
    expect(atributo(fixture, '#registro-descripcion')).toBe('500');
  });

  it('vereda de 101 caracteres con rol PRODUCTOR es inválida, y sigue siendo obligatoria', () => {
    const registro = sinPlantilla();
    const control = registro.formulario.controls['vereda'];
    registro.elegirRol('PRODUCTOR');
    expect(control.errors?.['required']).toBeTruthy();
    control.setValue('a'.repeat(101));
    expect(control.errors?.['maxlength']).toBeTruthy();
    // Sin rol PRODUCTOR no es obligatoria, pero el límite se mantiene.
    registro.elegirRol('COMPRADOR');
    expect(control.errors?.['maxlength']).toBeTruthy();
    control.setValue('');
    expect(control.valid).toBe(true);

    const fixture = abrir('Soy productor');
    const vereda = formulario(fixture).controls['vereda'];
    expect(vereda.errors?.['required']).toBeTruthy();

    escribir(fixture, '#registro-vereda', 'a'.repeat(101));
    expect(vereda.invalid).toBe(true);
    expect(vereda.errors?.['maxlength']).toBeTruthy();
    expect(texto(fixture)).toContain('La vereda puede tener hasta 100 letras.');
    expect(atributo(fixture, '#registro-vereda')).toBe('100');
  });
});
