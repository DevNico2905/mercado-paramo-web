import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Pedido } from '../../../core/api/models';
import { AdminPedidos } from './pedidos';

registerLocaleData(localeEsCo);

const URL = `${environment.apiUrl}/api/admin/pedidos`;

const pedido = (id: number, estado: Pedido['estado'], total: number): Pedido => ({
  id,
  fecha: '2026-11-12T10:00:00',
  estado,
  total,
  comision: total * 0.05,
  montoProductor: total * 0.95,
  direccionEntrega: 'Calle 1',
  compradorNombre: 'María López',
  compradorTelefono: '3100000000',
  productorId: 10,
  productorNombre: 'Pedro Rodríguez',
  vereda: 'La Concepción',
  detalles: [],
});

describe('Todos los pedidos (fundación)', () => {
  let fixture: ComponentFixture<AdminPedidos>;
  let backend: HttpTestingController;

  const raiz = () => fixture.nativeElement as HTMLElement;
  const texto = () => raiz().textContent.replace(/\s+/g, ' ');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminPedidos);
  });

  afterEach(() => backend.verify());

  it('envía todos los filtros de la sección 5.1 a la API', () => {
    fixture.componentRef.setInput('estado', 'ENTREGADO');
    fixture.componentRef.setInput('desde', '2026-11-01');
    fixture.componentRef.setInput('hasta', '2026-11-30');
    fixture.componentRef.setInput('orden', 'mayor-total');
    fixture.detectChanges();

    const peticion = backend.expectOne((r) => r.url === URL);
    expect(peticion.request.params.toString()).toBe(
      'ordenarPor=TOTAL&direccion=DESC&estado=ENTREGADO&desde=2026-11-01&hasta=2026-11-30',
    );
    peticion.flush([]);
  });

  it('muestra la tabla y las tarjetas con número, comprador, productor, estado y total', () => {
    fixture.detectChanges();
    backend
      .expectOne((r) => r.url === URL)
      .flush([pedido(41, 'ENTREGADO', 24000), pedido(42, 'PENDIENTE', 12000)]);
    fixture.detectChanges();

    const filas = raiz().querySelectorAll('tbody tr');
    expect(filas).toHaveLength(2);
    expect(filas[0].textContent.replace(/\s+/g, ' ')).toMatch(
      /n\.º 41.*María López.*Pedro Rodríguez.*Entregado.*\$24\.000/,
    );
    expect(raiz().querySelectorAll('ul article')).toHaveLength(2);
    expect(texto()).toContain('2 pedidos · $36.000 en total');
  });

  it('es solo lectura: no ofrece acciones sobre los pedidos', () => {
    fixture.detectChanges();
    backend.expectOne((r) => r.url === URL).flush([pedido(42, 'PENDIENTE', 12000)]);
    fixture.detectChanges();

    const acciones = [...raiz().querySelectorAll('section[aria-label="Pedidos"] button')];
    expect(acciones).toHaveLength(0);
  });

  it('no consulta la API con un rango de fechas invertido', () => {
    fixture.componentRef.setInput('desde', '2026-11-30');
    fixture.componentRef.setInput('hasta', '2026-11-01');
    fixture.detectChanges();

    backend.expectNone((r) => r.url === URL);
    expect(texto()).toContain('La fecha inicial no puede ser posterior a la final.');
  });
});
