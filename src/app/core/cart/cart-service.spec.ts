import { TestBed } from '@angular/core/testing';
import { Producto } from '../api/models';
import { CartService } from './cart-service';

function producto(cambios: Partial<Producto> = {}): Producto {
  return {
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
    ...cambios,
  };
}

const fresas = producto({
  id: 3,
  nombre: 'Fresas',
  precio: 8000,
  productorId: 11,
  productorNombre: 'Ana Gómez',
  vereda: 'Santa Ana',
});

describe('CartService', () => {
  let cart: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    cart = TestBed.inject(CartService);
  });

  it('calcula total, unidades y monto del productor (95 %)', () => {
    cart.agregar(producto(), 2);
    cart.agregar(producto({ id: 2, nombre: 'Papa criolla', precio: 4500 }));

    expect(cart.total()).toBe(28500);
    expect(cart.cantidadItems()).toBe(3);
    expect(cart.montoProductor()).toBe(27075);
    expect(cart.carrito().productorNombre).toBe('Pedro Rodríguez');
    expect(cart.carrito().vereda).toBe('La Concepción');
  });

  it('solo admite un productor por carrito', () => {
    cart.agregar(producto());

    expect(cart.agregar(fresas)).toBe('otro-productor');
    expect(cart.items().map((item) => item.nombre)).toEqual(['Queso campesino']);

    expect(cart.reemplazarCon(fresas)).toBe('agregado');
    expect(cart.carrito().productorId).toBe(11);
    expect(cart.items().map((item) => item.nombre)).toEqual(['Fresas']);
  });

  it('mantiene la cantidad entre 1 y el stock', () => {
    expect(cart.agregar(producto({ stock: 3 }), 2)).toBe('agregado');
    expect(cart.agregar(producto({ stock: 3 }), 5)).toBe('tope');
    expect(cart.cantidadDe(1)).toBe(3);
    expect(cart.agregar(producto({ stock: 3 }))).toBe('sin-stock');

    cart.cambiarCantidad(1, 0);
    expect(cart.cantidadDe(1)).toBe(1);
    cart.cambiarCantidad(1, 99);
    expect(cart.cantidadDe(1)).toBe(3);
  });

  it('no agrega productos agotados', () => {
    expect(cart.agregar(producto({ stock: 0 }))).toBe('sin-stock');
    expect(cart.estaVacio()).toBe(true);
  });

  it('al quitar el último ítem libera al productor', () => {
    cart.agregar(producto());
    cart.quitar(1);

    expect(cart.estaVacio()).toBe(true);
    expect(cart.agregar(fresas)).toBe('agregado');
  });

  it('sincroniza el stock y el precio con los datos frescos del producto', () => {
    cart.agregar(producto(), 4);
    cart.sincronizar(producto({ stock: 2, precio: 13000 }));

    expect(cart.cantidadDe(1)).toBe(2);
    expect(cart.total()).toBe(26000);

    cart.sincronizar(producto({ activo: false }));
    expect(cart.estaVacio()).toBe(true);
  });

  it('persiste en localStorage con la clave mp_carrito y lo restaura', () => {
    cart.agregar(producto(), 2);

    const guardado = JSON.parse(localStorage.getItem('mp_carrito') ?? '{}');
    expect(guardado.productorId).toBe(10);
    expect(guardado.items).toEqual([
      {
        productoId: 1,
        nombre: 'Queso campesino',
        unidad: 'libra',
        precio: 12000,
        cantidad: 2,
        stock: 5,
        categoriaNombre: 'Lácteos',
      },
    ]);

    TestBed.resetTestingModule();
    const restaurado = TestBed.inject(CartService);
    expect(restaurado.cantidadDe(1)).toBe(2);

    restaurado.vaciar();
    expect(localStorage.getItem('mp_carrito')).toBeNull();
  });

  it('ignora un carrito guardado con formato inválido', () => {
    localStorage.setItem('mp_carrito', '{"items":"roto"');
    TestBed.resetTestingModule();

    expect(TestBed.inject(CartService).estaVacio()).toBe(true);
  });
});
