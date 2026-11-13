import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoPedido, Pedido, Producto, ProductoRequest, ReporteVentas } from './models';
import { FiltrosPedidos, parametrosDePedidos } from './pedidos-service';

/** Estados a los que el productor puede llevar un pedido (SPEC 5.2). */
export type EstadoDelProductor = Extract<EstadoPedido, 'ACEPTADO' | 'RECHAZADO' | 'ENTREGADO'>;

export interface RangoFechas {
  desde: string;
  hasta: string;
}

/** Recursos del productor autenticado: sus productos, pedidos recibidos y reporte. */
@Injectable({ providedIn: 'root' })
export class ProductorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/productor`;

  misProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.base}/productos`);
  }

  /** No hay un endpoint de detalle propio: se busca en "mis productos", que incluye los ocultos. */
  miProducto(id: number): Observable<Producto | null> {
    return this.misProductos().pipe(
      map((productos) => productos.find((producto) => producto.id === id) ?? null),
    );
  }

  crearProducto(producto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(`${this.base}/productos`, producto);
  }

  actualizarProducto(id: number, producto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.base}/productos/${id}`, producto);
  }

  /** Oculta el producto del catálogo. */
  desactivarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/productos/${id}`);
  }

  pedidosRecibidos(filtros: FiltrosPedidos = {}): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.base}/pedidos`, {
      params: parametrosDePedidos(filtros),
    });
  }

  cambiarEstado(id: number, estado: EstadoDelProductor): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.base}/pedidos/${id}/estado`, { estado });
  }

  reporteVentas(rango: RangoFechas): Observable<ReporteVentas> {
    const params = new HttpParams().set('desde', rango.desde).set('hasta', rango.hasta);
    return this.http.get<ReporteVentas>(`${this.base}/reportes/ventas`, { params });
  }
}
