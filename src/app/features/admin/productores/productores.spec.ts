import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Productor } from '../../../core/api/models';
import { ConfirmService } from '../../../core/ui/confirm-service';
import { ToastService } from '../../../core/ui/toast-service';
import { Productores } from './productores';

const URL = `${environment.apiUrl}/api/admin/productores`;

const productor = (
  id: number,
  nombre: string,
  estado: Productor['estadoVerificacion'],
): Productor => ({
  id,
  nombre,
  email: `${nombre.split(' ')[0].toLowerCase()}@correo.com`,
  telefono: '3001234567',
  vereda: 'La Concepción',
  descripcion: 'Quesos y papa criolla',
  estadoVerificacion: estado,
});

describe('Verificación de productores', () => {
  let fixture: ComponentFixture<Productores>;
  let backend: HttpTestingController;
  let confirmar: ReturnType<typeof vi.spyOn>;

  const texto = () => (fixture.nativeElement as HTMLElement).textContent.replace(/\s+/g, ' ');
  const boton = (etiqueta: string) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      `button[aria-label="${etiqueta}"]`,
    );

  function abrir(productores: Productor[], pestana?: string): void {
    fixture = TestBed.createComponent(Productores);
    if (pestana) {
      fixture.componentRef.setInput('pestana', pestana);
    }
    fixture.detectChanges();
    const peticion = backend.expectOne(URL);
    expect(peticion.request.params.has('estado')).toBe(false);
    peticion.flush(productores);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    backend = TestBed.inject(HttpTestingController);
    confirmar = vi.spyOn(TestBed.inject(ConfirmService), 'confirmar').mockResolvedValue(true);
  });

  afterEach(() => backend.verify());

  it('abre en Pendientes, con contadores y los datos de contacto', () => {
    abrir([
      productor(1, 'Pedro Rodríguez', 'PENDIENTE'),
      productor(2, 'Ana Gómez', 'VERIFICADO'),
      productor(3, 'Luis Mora', 'RECHAZADO'),
    ]);

    expect(texto()).toContain('Pendientes 1');
    expect(texto()).toContain('Verificados 1');
    expect(texto()).toContain('Rechazados 1');
    expect(texto()).toContain('Pedro Rodríguez');
    expect(texto()).not.toContain('Ana Gómez');
    expect(texto()).toContain('Vereda La Concepción');
    expect(texto()).toContain('Quesos y papa criolla');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('a[href="tel:3001234567"]'),
    ).not.toBeNull();
  });

  it('verificar pide confirmación y mueve al productor a Verificados sin recargar', async () => {
    abrir([productor(1, 'Pedro Rodríguez', 'PENDIENTE')]);
    boton('Verificar a Pedro Rodríguez')?.click();
    await fixture.whenStable();

    expect(confirmar).toHaveBeenCalled();
    const peticion = backend.expectOne(`${URL}/1/verificacion`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ estado: 'VERIFICADO' });
    peticion.flush(productor(1, 'Pedro Rodríguez', 'VERIFICADO'));
    fixture.detectChanges();

    expect(texto()).toContain('Pendientes 0');
    expect(texto()).toContain('Verificados 1');
    expect(texto()).toContain('Todos los productores están al día');
    expect(TestBed.inject(ToastService).toasts()[0].mensaje).toContain(
      'Verificaste a Pedro Rodríguez',
    );
  });

  it('rechazar no hace nada si se cancela la confirmación', async () => {
    confirmar.mockResolvedValue(false);
    abrir([productor(1, 'Pedro Rodríguez', 'PENDIENTE')]);
    boton('Rechazar a Pedro Rodríguez')?.click();
    await fixture.whenStable();

    backend.expectNone(`${URL}/1/verificacion`);
  });

  it('las pestañas de verificados y rechazados no ofrecen acciones', () => {
    abrir([productor(2, 'Ana Gómez', 'VERIFICADO')], 'verificados');

    expect(texto()).toContain('Ana Gómez');
    expect(boton('Verificar a Ana Gómez')).toBeNull();
    expect(boton('Rechazar a Ana Gómez')).toBeNull();
  });

  it('con un 409 muestra el mensaje y recarga la lista', async () => {
    abrir([productor(1, 'Pedro Rodríguez', 'PENDIENTE')]);
    boton('Verificar a Pedro Rodríguez')?.click();
    await fixture.whenStable();
    backend
      .expectOne(`${URL}/1/verificacion`)
      .flush(
        { status: 409, message: 'Solo se puede verificar un productor PENDIENTE', errores: {} },
        { status: 409, statusText: 'Conflict' },
      );

    expect(TestBed.inject(ToastService).toasts()[0].mensaje).toBe(
      'Solo se puede verificar un productor PENDIENTE',
    );
    backend.expectOne(URL).flush([productor(1, 'Pedro Rodríguez', 'VERIFICADO')]);
  });
});
