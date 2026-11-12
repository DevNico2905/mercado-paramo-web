import { Injectable, computed, effect, signal } from '@angular/core';
import { Producto } from '../api/models';
import { PARTICIPACION_PRODUCTOR } from '../impacto';

const CLAVE = 'mp_carrito';

export interface ItemCarrito {
  productoId: number;
  nombre: string;
  unidad: string;
  precio: number;
  cantidad: number;
  stock: number;
  categoriaNombre: string;
}

export interface Carrito {
  productorId: number | null;
  productorNombre: string;
  vereda: string;
  items: ItemCarrito[];
}

/**
 * - `agregado`: el producto quedó en el carrito con la cantidad pedida.
 * - `tope`: quedó en el carrito, pero la cantidad se limitó al stock disponible.
 * - `sin-stock`: no se agregó porque no hay stock o ya estaba el máximo.
 * - `otro-productor`: no se agregó porque el carrito es de otro productor.
 */
export type ResultadoAgregar = 'agregado' | 'tope' | 'sin-stock' | 'otro-productor';

const VACIO: Carrito = { productorId: null, productorNombre: '', vereda: '', items: [] };

function esItem(valor: unknown): valor is ItemCarrito {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const item = valor as Record<string, unknown>;
  return (
    typeof item['productoId'] === 'number' &&
    typeof item['nombre'] === 'string' &&
    typeof item['unidad'] === 'string' &&
    typeof item['precio'] === 'number' &&
    typeof item['cantidad'] === 'number' &&
    typeof item['stock'] === 'number' &&
    typeof item['categoriaNombre'] === 'string'
  );
}

function leerGuardado(): Carrito {
  try {
    const guardado: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    if (typeof guardado !== 'object' || guardado === null) {
      return VACIO;
    }
    const carrito = guardado as Record<string, unknown>;
    const items = carrito['items'];
    if (
      typeof carrito['productorId'] !== 'number' ||
      typeof carrito['productorNombre'] !== 'string' ||
      typeof carrito['vereda'] !== 'string' ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !items.every(esItem)
    ) {
      return VACIO;
    }
    return {
      productorId: carrito['productorId'],
      productorNombre: carrito['productorNombre'],
      vereda: carrito['vereda'],
      items,
    };
  } catch {
    return VACIO;
  }
}

function limitar(cantidad: number, stock: number): number {
  return Math.max(1, Math.min(Math.floor(cantidad), stock));
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _carrito = signal<Carrito>(leerGuardado());

  readonly carrito = this._carrito.asReadonly();
  readonly items = computed(() => this._carrito().items);
  readonly estaVacio = computed(() => this.items().length === 0);
  /** Unidades en el carrito (suma de las cantidades). */
  readonly cantidadItems = computed(() =>
    this.items().reduce((suma, item) => suma + item.cantidad, 0),
  );
  readonly total = computed(() =>
    this.items().reduce((suma, item) => suma + item.precio * item.cantidad, 0),
  );
  /** Solo para mostrar: el valor oficial lo calcula la API al crear el pedido. */
  readonly montoProductor = computed(() => Math.round(this.total() * PARTICIPACION_PRODUCTOR));

  constructor() {
    effect(() => {
      const carrito = this._carrito();
      if (carrito.items.length === 0) {
        localStorage.removeItem(CLAVE);
      } else {
        localStorage.setItem(CLAVE, JSON.stringify(carrito));
      }
    });
  }

  cantidadDe(productoId: number): number {
    return this.items().find((item) => item.productoId === productoId)?.cantidad ?? 0;
  }

  /** Indica si agregar el producto rompería la regla de un solo productor por carrito. */
  esDeOtroProductor(producto: Producto): boolean {
    const { productorId } = this._carrito();
    return productorId !== null && productorId !== producto.productorId;
  }

  agregar(producto: Producto, cantidad = 1): ResultadoAgregar {
    if (this.esDeOtroProductor(producto)) {
      return 'otro-productor';
    }
    const enCarrito = this.cantidadDe(producto.id);
    if (producto.stock < 1 || enCarrito >= producto.stock) {
      return 'sin-stock';
    }
    const pedida = enCarrito + Math.max(1, Math.floor(cantidad));
    const nueva = limitar(pedida, producto.stock);
    const item: ItemCarrito = {
      productoId: producto.id,
      nombre: producto.nombre,
      unidad: producto.unidad,
      precio: producto.precio,
      cantidad: nueva,
      stock: producto.stock,
      categoriaNombre: producto.categoriaNombre,
    };
    this._carrito.update((carrito) => ({
      productorId: producto.productorId,
      productorNombre: producto.productorNombre,
      vereda: producto.vereda,
      items:
        enCarrito > 0
          ? carrito.items.map((actual) => (actual.productoId === item.productoId ? item : actual))
          : [...carrito.items, item],
    }));
    return nueva < pedida ? 'tope' : 'agregado';
  }

  /** Vacía el carrito y agrega el producto: para cuando el usuario acepta cambiar de productor. */
  reemplazarCon(producto: Producto, cantidad = 1): ResultadoAgregar {
    this.vaciar();
    return this.agregar(producto, cantidad);
  }

  /** Cambia la cantidad de un ítem, entre 1 y su stock. */
  cambiarCantidad(productoId: number, cantidad: number): void {
    this.actualizarItems((items) =>
      items.map((item) =>
        item.productoId === productoId
          ? { ...item, cantidad: limitar(cantidad, item.stock) }
          : item,
      ),
    );
  }

  quitar(productoId: number): void {
    this.actualizarItems((items) => items.filter((item) => item.productoId !== productoId));
  }

  /**
   * Actualiza un ítem con los datos frescos del producto (por ejemplo, tras un 409 de stock).
   * Si ya no está disponible, lo quita; si el stock bajó, ajusta la cantidad.
   */
  sincronizar(producto: Producto): void {
    if (!producto.activo || producto.stock < 1) {
      this.quitar(producto.id);
      return;
    }
    this.actualizarItems((items) =>
      items.map((item) =>
        item.productoId === producto.id
          ? {
              ...item,
              nombre: producto.nombre,
              unidad: producto.unidad,
              precio: producto.precio,
              stock: producto.stock,
              cantidad: limitar(item.cantidad, producto.stock),
            }
          : item,
      ),
    );
  }

  vaciar(): void {
    this._carrito.set(VACIO);
  }

  private actualizarItems(cambio: (items: ItemCarrito[]) => ItemCarrito[]): void {
    this._carrito.update((carrito) => {
      const items = cambio(carrito.items);
      return items.length === 0 ? VACIO : { ...carrito, items };
    });
  }
}
