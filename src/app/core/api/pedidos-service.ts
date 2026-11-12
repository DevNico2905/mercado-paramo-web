import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pedido, PedidoRequest } from './models';
import { operations } from './schema';

/** Filtros de los listados de pedidos (SPEC 5.1). Todos son opcionales. */
export type FiltrosPedidos = NonNullable<operations['misPedidos']['parameters']['query']>;

export function parametrosDePedidos(filtros: FiltrosPedidos): HttpParams {
  let params = new HttpParams();
  for (const [nombre, valor] of Object.entries(filtros)) {
    if (valor) {
      params = params.set(nombre, valor);
    }
  }
  return params;
}

/** Pedidos del comprador. */
@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/pedidos`;

  crear(pedido: PedidoRequest): Observable<Pedido> {
    return this.http.post<Pedido>(this.base, pedido);
  }

  misPedidos(filtros: FiltrosPedidos = {}): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.base, { params: parametrosDePedidos(filtros) });
  }

  cancelar(id: number): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.base}/${id}/cancelar`, null);
  }
}
