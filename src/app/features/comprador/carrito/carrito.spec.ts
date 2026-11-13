import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Pedido, Producto } from '../../../core/api/models';
import { AuthService } from '../../../core/auth/auth-service';
import { CartService } from '../../../core/cart/cart-service';
import { Carrito } from './carrito';

registerLocaleData(localeEsCo);

const api = (ruta: string) => `${environment.apiUrl}${ruta}`;

const queso: Producto = {
  id: 1,
  nombre: 'Queso campesino',
  unidad: 'libra',
  precio: 12000,
  stock: 5,
  activo: true,
  categoriaId: 2,
  categoriaNombre: 'Lácteos',
  productorId: 10,
  productorNombre: 'Pedro Rodríguez',
  vereda: 'La Concepción',
};

/** La API cobra una comisión distinta al 5 % a propósito, para comprobar que se usan sus valores. */
const pedidoCreado: Pedido = {
  id: 45,
  fecha: '2026-11-12T10:00:00',
  estado: 'PENDIENTE',
  total: 24000,
  comision: 1300,
  montoProductor: 22700,
  direccionEntrega: 'Calle 1 # 2-3',
  compradorNombre: 'María',
  compradorTelefono: '3100000000',
  productorId: 10,
  productorNombre: 'Pedro Rodríguez',
  vereda: 'La Concepción',
  detalles: [],
};

describe('Carrito', () => {
  let fixture: ComponentFixture<Carrito>;
  let backend: HttpTestingController;
  let cart: CartService;
  let router: Router;

  const texto = () => (fixture.nativeElement as HTMLElement).textContent.replace(/\s+/g, ' ');
  const boton = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type=submit]');

  function escribirDireccion(valor: string): void {
    const campo = (fixture.nativeElement as HTMLElement).querySelector('textarea');
    if (!campo) {
      throw new Error('No se encontró el campo de dirección');
    }
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function iniciarSesion(): void {
    TestBed.inject(AuthService).cargarPerfil().subscribe();
    backend.expectOne(api('/api/usuarios/me')).flush({
      id: 7,
      nombre: 'María',
      email: 'm@correo.com',
      rol: 'COMPRADOR',
      estadoVerificacion: null,
    });
  }

  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    cart = TestBed.inject(CartService);
    router = TestBed.inject(Router);
    cart.agregar(queso, 2);
    fixture = TestBed.createComponent(Carrito);
    fixture.detectChanges();
  });

  afterEach(() => backend.verify());

  it('muestra el pedido, el total y lo que llega al productor', () => {
    expect(texto()).toContain('Tu pedido a Pedro');
    expect(texto()).toContain('vereda La Concepción');
    expect(texto()).toContain('$24.000');
    expect(texto()).toContain('$22.800 llegan a Pedro');
    expect(texto()).toContain('Pago contra entrega');
    expect(texto()).toContain('2 libras');
  });

  it('exige la dirección de entrega antes de enviar', () => {
    iniciarSesion();
    boton()?.click();
    fixture.detectChanges();

    expect(texto()).toContain('Escribe la dirección donde recibirás el pedido.');
    backend.expectNone(api('/api/pedidos'));
  });

  it('sin sesión, lleva al login con redirect=/carrito y conserva el carrito', () => {
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    escribirDireccion('Calle 1 # 2-3');
    boton()?.click();

    expect(navegar).toHaveBeenCalledWith(['/login'], { queryParams: { redirect: '/carrito' } });
    backend.expectNone(api('/api/pedidos'));
    expect(cart.cantidadDe(1)).toBe(2);
    expect(cart.direccionBorrador()).toBe('Calle 1 # 2-3');
  });

  it('confirma una sola vez y celebra con los valores que devuelve la API', () => {
    iniciarSesion();
    escribirDireccion('  Calle 1 # 2-3  ');
    boton()?.click();
    fixture.detectChanges();

    expect(boton()?.disabled).toBe(true);
    boton()?.click();

    const peticion = backend.expectOne(api('/api/pedidos'));
    expect(peticion.request.body).toEqual({
      direccionEntrega: 'Calle 1 # 2-3',
      items: [{ productoId: 1, cantidad: 2 }],
    });
    peticion.flush(pedidoCreado);
    fixture.detectChanges();

    expect(cart.estaVacio()).toBe(true);
    expect(texto()).toContain('¡Pedido confirmado!');
    expect(texto()).toContain('Pedido n.º 45');
    expect(texto()).toContain('De tus $24.000, $22.700 llegan a Pedro en la vereda La Concepción.');
    expect(texto()).toContain('$1.300');
    expect(texto()).toContain('94,6 %');
    expect(texto()).not.toContain('$22.800');
  });

  it('con un 409 de stock muestra el mensaje y refresca el stock del carrito', () => {
    iniciarSesion();
    escribirDireccion('Calle 1 # 2-3');
    boton()?.click();

    backend
      .expectOne(api('/api/pedidos'))
      .flush(
        { status: 409, message: 'Stock insuficiente para Queso campesino', errores: {} },
        { status: 409, statusText: 'Conflict' },
      );
    backend.expectOne(api('/api/productos/1')).flush({ ...queso, stock: 1 });
    fixture.detectChanges();

    expect(texto()).toContain('Stock insuficiente para Queso campesino');
    expect(cart.cantidadDe(1)).toBe(1);
    expect(texto()).toContain('Es todo lo que hay disponible: 1 libra.');
    expect(boton()?.disabled).toBe(false);
  });
});
