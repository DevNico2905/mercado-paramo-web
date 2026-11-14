import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { EstadoVerificacion, Pedido, Producto } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth-service';
import { ConfirmService } from '../../core/ui/confirm-service';
import { ToastService } from '../../core/ui/toast-service';
import { MisProductos } from './mis-productos/mis-productos';
import { PedidosRecibidos } from './pedidos-recibidos/pedidos-recibidos';
import { ProductoForm } from './producto-form/producto-form';
import { ReporteVentas } from './reporte-ventas/reporte-ventas';

registerLocaleData(localeEsCo);

const api = (ruta: string) => `${environment.apiUrl}${ruta}`;
const categorias = [
  { id: 1, nombre: 'Tubérculos' },
  { id: 2, nombre: 'Lácteos' },
];
const queso: Producto = {
  id: 1,
  nombre: 'Queso campesino',
  unidad: 'libra',
  precio: 12000,
  stock: 8,
  activo: true,
  categoriaId: 2,
  categoriaNombre: 'Lácteos',
  productorId: 10,
  productorNombre: 'Pedro Rodríguez',
  vereda: 'La Concepción',
};
const pendiente: Pedido = {
  id: 45,
  fecha: '2026-11-12T10:00:00',
  estado: 'PENDIENTE',
  total: 24000,
  comision: 1200,
  montoProductor: 22800,
  direccionEntrega: 'Calle 1 # 2-3',
  compradorNombre: 'María López',
  compradorTelefono: '3109876543',
  productorId: 10,
  productorNombre: 'Pedro Rodríguez',
  vereda: 'La Concepción',
  detalles: [
    {
      productoId: 1,
      productoNombre: 'Queso campesino',
      unidad: 'libra',
      cantidad: 2,
      precioUnitario: 12000,
      subtotal: 24000,
    },
  ],
};

describe('pantallas del productor', () => {
  let backend: HttpTestingController;

  const texto = (fixture: ComponentFixture<unknown>) =>
    (fixture.nativeElement as HTMLElement).textContent.replace(/\s+/g, ' ');
  const botones = (fixture: ComponentFixture<unknown>, nombre: string) =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].filter((b) =>
      b.textContent.includes(nombre),
    );

  function sesion(estadoVerificacion: EstadoVerificacion): void {
    TestBed.inject(AuthService).cargarPerfil().subscribe();
    backend.expectOne(api('/api/usuarios/me')).flush({
      id: 10,
      nombre: 'Pedro Rodríguez',
      email: 'p@correo.com',
      rol: 'PRODUCTOR',
      estadoVerificacion,
      vereda: 'La Concepción',
    });
  }

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
  });

  afterEach(() => backend.verify());

  describe('Mis productos', () => {
    function abrir(estado: EstadoVerificacion, productos: Producto[]) {
      sesion(estado);
      const fixture = TestBed.createComponent(MisProductos);
      fixture.detectChanges();
      backend.expectOne(api('/api/productor/productos')).flush(productos);
      fixture.detectChanges();
      return fixture;
    }

    it('en revisión: deshabilita "Nuevo producto" y explica por qué', () => {
      const fixture = abrir('PENDIENTE', []);

      expect(botones(fixture, 'Nuevo producto')[0].disabled).toBe(true);
      expect(texto(fixture)).toContain('Podrás publicar cuando la fundación apruebe tu cuenta.');
    });

    it('rechazado: explica que no puede publicar', () => {
      const fixture = abrir('RECHAZADO', []);

      expect(botones(fixture, 'Nuevo producto')[0].disabled).toBe(true);
      expect(texto(fixture)).toContain('Tu cuenta no fue aprobada; por eso no puedes publicar.');
    });

    it('se desbloquea en cuanto el perfil pasa a VERIFICADO, sin recargar', () => {
      const fixture = abrir('PENDIENTE', []);
      sesion('VERIFICADO');
      fixture.detectChanges();

      expect(botones(fixture, 'Nuevo producto')).toHaveLength(0);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          'a[href="/productor/productos/nuevo"]',
        ),
      ).not.toBeNull();
    });

    it('verificado: permite crear y marca los ocultos', () => {
      const fixture = abrir('VERIFICADO', [
        { ...queso, id: 2, nombre: 'Papa criolla', activo: false },
        queso,
      ]);
      const enlace = (fixture.nativeElement as HTMLElement).querySelector(
        'a[href="/productor/productos/nuevo"]',
      );

      expect(enlace).not.toBeNull();
      expect(texto(fixture)).toContain('Oculto del catálogo');
      expect(botones(fixture, 'Mostrar de nuevo')).toHaveLength(1);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          'a[href="/productor/productos/2/editar"]',
        ),
      ).not.toBeNull();
      expect(texto(fixture).indexOf('Queso campesino')).toBeLessThan(
        texto(fixture).indexOf('Papa criolla'),
      );
    });

    it('ocultar pide confirmación y llama a DELETE', async () => {
      const fixture = abrir('VERIFICADO', [queso]);
      vi.spyOn(TestBed.inject(ConfirmService), 'confirmar').mockResolvedValue(true);

      botones(fixture, 'Ocultar')[0].click();
      await fixture.whenStable();
      const peticion = backend.expectOne(api('/api/productor/productos/1'));
      expect(peticion.request.method).toBe('DELETE');
      peticion.flush(null);
      fixture.detectChanges();

      expect(texto(fixture)).toContain('Oculto del catálogo');
    });

    it('"Mostrar de nuevo" llama a reactivar y vuelve a ofrecer "Ocultar"', () => {
      const fixture = abrir('VERIFICADO', [{ ...queso, activo: false }]);
      botones(fixture, 'Mostrar de nuevo')[0].click();

      const peticion = backend.expectOne(api('/api/productor/productos/1/reactivar'));
      expect(peticion.request.method).toBe('PATCH');
      peticion.flush(queso);
      fixture.detectChanges();

      expect(texto(fixture)).not.toContain('Oculto del catálogo');
      expect(botones(fixture, 'Ocultar')).toHaveLength(1);
    });
  });

  describe('Formulario de producto', () => {
    function abrir(id?: string) {
      sesion('VERIFICADO');
      const fixture = TestBed.createComponent(ProductoForm);
      if (id) {
        fixture.componentRef.setInput('id', id);
      }
      fixture.detectChanges();
      backend.expectOne(api('/api/categorias')).flush(categorias);
      if (id) {
        backend.expectOne(api('/api/productor/productos')).flush([queso]);
      }
      fixture.detectChanges();
      return fixture;
    }

    const formulario = (fixture: ComponentFixture<unknown>): FormGroup =>
      fixture.debugElement.query(By.directive(FormGroupDirective)).injector.get(FormGroupDirective)
        .form;

    /** Formulario sin renderizar la plantilla: solo los validators del FormControl. */
    function sinPlantilla(): FormGroup {
      const instancia = TestBed.createComponent(ProductoForm).componentInstance as unknown as {
        formulario: FormGroup;
      };
      backend.expectOne(api('/api/categorias')).flush(categorias);
      return instancia.formulario;
    }

    function escribir(fixture: ComponentFixture<unknown>, selector: string, valor: string) {
      const campo = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
        selector,
      );
      if (!campo) {
        throw new Error(`No existe ${selector}`);
      }
      campo.value = valor;
      campo.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    it('la vista previa cambia mientras se escribe', () => {
      const fixture = abrir();
      const tarjeta = () =>
        (fixture.nativeElement as HTMLElement)
          .querySelector('app-product-card')
          ?.textContent.replace(/\s+/g, ' ') ?? '';

      expect(tarjeta()).toContain('Nombre del producto');
      escribir(fixture, '#producto-nombre', 'Cuajada');
      escribir(fixture, '#producto-precio', '9500');
      botones(fixture, 'Por atado')[0].click();
      fixture.detectChanges();

      expect(tarjeta()).toContain('Cuajada');
      expect(tarjeta()).toContain('$9.500');
      expect(tarjeta()).toContain('/ atado');
      expect(tarjeta()).toContain('La Concepción');
    });

    it('crea con POST y vuelve a mis productos', () => {
      const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      const fixture = abrir();
      escribir(fixture, '#producto-nombre', '  Cuajada  ');
      escribir(fixture, '#producto-unidad', 'unidad');
      escribir(fixture, '#producto-precio', '9500');
      escribir(fixture, '#producto-stock', '6');
      (fixture.nativeElement as HTMLElement)
        .querySelectorAll<HTMLInputElement>('input[type=radio]')[1]
        .click();
      fixture.detectChanges();
      botones(fixture, 'Publicar producto')[0].click();

      const peticion = backend.expectOne(api('/api/productor/productos'));
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body).toEqual({
        nombre: 'Cuajada',
        unidad: 'unidad',
        precio: 9500,
        stock: 6,
        categoriaId: 2,
      });
      peticion.flush({ ...queso, id: 3, nombre: 'Cuajada' });

      expect(navegar).toHaveBeenCalledWith('/productor/productos');
      expect(TestBed.inject(ToastService).toasts()[0].mensaje).toContain(
        'Cuajada ya está en el catálogo',
      );
    });

    it('no envía precios con decimales ni cero', () => {
      const fixture = abrir();
      escribir(fixture, '#producto-precio', '0');
      botones(fixture, 'Publicar producto')[0].click();
      fixture.detectChanges();
      expect(texto(fixture)).toContain('El precio debe ser mayor que cero.');

      escribir(fixture, '#producto-precio', '9500.5');
      expect(texto(fixture)).toContain('Escribe el precio en pesos, sin puntos ni centavos.');
      backend.expectNone(api('/api/productor/productos'));
    });

    it('stock mayor a 100.000 es inválido, muestra el mensaje y no se envía', () => {
      const control = sinPlantilla().controls['stock'];
      control.setValue(100001);
      expect(control.errors?.['max']).toBeTruthy();

      const fixture = abrir();
      escribir(fixture, '#producto-stock', '100001');
      botones(fixture, 'Publicar producto')[0].click();
      fixture.detectChanges();

      const stock = formulario(fixture).controls['stock'];
      expect(stock.invalid).toBe(true);
      expect(stock.errors?.['max']).toBeTruthy();
      expect(texto(fixture)).toContain('La cantidad puede ser hasta 100.000.');
      backend.expectNone(api('/api/productor/productos'));

      escribir(fixture, '#producto-stock', '100000');
      expect(stock.valid).toBe(true);
      expect(
        (fixture.nativeElement as HTMLElement)
          .querySelector('#producto-stock')
          ?.getAttribute('max'),
      ).toBe('100000');
    });

    it('precio mayor a 9.999.999.999 es inválido y muestra el mensaje', () => {
      const control = sinPlantilla().controls['precio'];
      control.setValue(10000000000);
      expect(control.errors?.['max']).toBeTruthy();

      const fixture = abrir();
      escribir(fixture, '#producto-precio', '10000000000');
      botones(fixture, 'Publicar producto')[0].click();
      fixture.detectChanges();

      const precio = formulario(fixture).controls['precio'];
      expect(precio.invalid).toBe(true);
      expect(precio.errors?.['max']).toBeTruthy();
      expect(texto(fixture)).toContain('El precio puede ser hasta $9.999.999.999.');
      expect(
        (fixture.nativeElement as HTMLElement)
          .querySelector('#producto-precio')
          ?.getAttribute('max'),
      ).toBe('9999999999');
      backend.expectNone(api('/api/productor/productos'));
    });

    it('edita con PUT a partir de los datos actuales', () => {
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      const fixture = abrir('1');
      expect(
        (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#producto-nombre')
          ?.value,
      ).toBe('Queso campesino');

      escribir(fixture, '#producto-stock', '3');
      botones(fixture, 'Guardar cambios')[0].click();

      const peticion = backend.expectOne(api('/api/productor/productos/1'));
      expect(peticion.request.method).toBe('PUT');
      expect(peticion.request.body).toEqual({
        nombre: 'Queso campesino',
        unidad: 'libra',
        precio: 12000,
        stock: 3,
        categoriaId: 2,
      });
      peticion.flush({ ...queso, stock: 3 });
    });
  });

  describe('Pedidos recibidos', () => {
    function abrir(pedidos: Pedido[]) {
      const fixture = TestBed.createComponent(PedidosRecibidos);
      fixture.detectChanges();
      const peticion = backend.expectOne((r) => r.url === api('/api/productor/pedidos'));
      expect(peticion.request.params.has('estado')).toBe(false);
      peticion.flush(pedidos);
      fixture.detectChanges();
      return fixture;
    }

    it('muestra contadores, "Tú recibes", el teléfono y las acciones de PENDIENTE', () => {
      const fixture = abrir([pendiente, { ...pendiente, id: 46, estado: 'ACEPTADO' }]);

      expect(texto(fixture)).toContain('Por atender 1');
      expect(texto(fixture)).toContain('En curso 1');
      expect(texto(fixture)).toMatch(/Tú recibes ?\$22\.800/);
      expect(texto(fixture)).toContain('2 libras · Queso campesino');
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('a[href="tel:3109876543"]'),
      ).not.toBeNull();
      expect(botones(fixture, 'Aceptar pedido')).toHaveLength(1);
      expect(botones(fixture, 'Rechazar')).toHaveLength(1);
      expect(botones(fixture, 'Marcar entregado')).toHaveLength(0);
    });

    it('al aceptar, el pedido pasa a "En curso" sin recargar la lista', () => {
      const fixture = abrir([pendiente]);
      botones(fixture, 'Aceptar pedido')[0].click();

      const peticion = backend.expectOne(api('/api/productor/pedidos/45/estado'));
      expect(peticion.request.method).toBe('PATCH');
      expect(peticion.request.body).toEqual({ estado: 'ACEPTADO' });
      peticion.flush({ ...pendiente, estado: 'ACEPTADO' });
      fixture.detectChanges();

      expect(texto(fixture)).toContain('Por atender 0');
      expect(texto(fixture)).toContain('En curso 1');
      expect(texto(fixture)).toContain('No tienes pedidos por atender');
    });

    it('rechazar pide confirmación y no hace nada si se cancela', async () => {
      const confirmar = vi
        .spyOn(TestBed.inject(ConfirmService), 'confirmar')
        .mockResolvedValue(false);
      const fixture = abrir([pendiente]);
      botones(fixture, 'Rechazar')[0].click();
      await fixture.whenStable();

      expect(confirmar).toHaveBeenCalled();
      backend.expectNone(api('/api/productor/pedidos/45/estado'));
    });

    it('con un 409 muestra el mensaje y vuelve a cargar la lista', () => {
      const fixture = abrir([pendiente]);
      botones(fixture, 'Aceptar pedido')[0].click();
      backend
        .expectOne(api('/api/productor/pedidos/45/estado'))
        .flush(
          { status: 409, message: 'El pedido ya fue cancelado por el comprador', errores: {} },
          { status: 409, statusText: 'Conflict' },
        );
      fixture.detectChanges();

      expect(TestBed.inject(ToastService).toasts()[0].mensaje).toBe(
        'El pedido ya fue cancelado por el comprador',
      );
      backend
        .expectOne((r) => r.url === api('/api/productor/pedidos'))
        .flush([{ ...pendiente, estado: 'CANCELADO' }]);
    });
  });

  describe('Reporte de ventas', () => {
    function abrir(reporte: object) {
      const fixture = TestBed.createComponent(ReporteVentas);
      fixture.detectChanges();
      const peticion = backend.expectOne((r) => r.url === api('/api/productor/reportes/ventas'));
      expect(peticion.request.params.get('desde')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      peticion.flush(reporte);
      fixture.detectChanges();
      return fixture;
    }

    it('muestra las cifras, la participación real y las ventas por producto ordenadas', () => {
      const fixture = abrir({
        desde: '2026-10-14',
        hasta: '2026-11-12',
        pedidosEntregados: 3,
        totalVendido: 60000,
        comisionPlataforma: 3000,
        ingresoNeto: 57000,
        participacionPorcentaje: 95,
        productos: [
          {
            productoId: 2,
            nombre: 'Papa criolla',
            unidad: 'kilo',
            cantidadVendida: 4,
            totalVendido: 18000,
          },
          {
            productoId: 1,
            nombre: 'Queso campesino',
            unidad: 'libra',
            cantidadVendida: 3,
            totalVendido: 42000,
          },
        ],
      });

      expect(texto(fixture)).toContain('Recibiste $57.000');
      expect(texto(fixture)).toContain('Pedidos entregados 3');
      expect(texto(fixture)).toContain('3 libras');
      expect(texto(fixture)).toContain('4 kilos');
      expect(texto(fixture)).toContain('De $60.000 vendidos, recibiste $57.000.');
      expect(texto(fixture).indexOf('Queso campesino')).toBeLessThan(
        texto(fixture).indexOf('Papa criolla'),
      );
    });

    it('sin ventas entregadas (participación null) muestra el estado vacío', () => {
      const fixture = abrir({
        desde: '2026-10-14',
        hasta: '2026-11-12',
        pedidosEntregados: 0,
        totalVendido: 0,
        comisionPlataforma: 0,
        ingresoNeto: 0,
        participacionPorcentaje: null,
        productos: [],
      });

      expect(texto(fixture)).toContain('Aún no tienes ventas entregadas en este periodo');
      expect(texto(fixture)).not.toContain('Recibiste');
    });
  });
});
