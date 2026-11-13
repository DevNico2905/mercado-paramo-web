import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoVerificacion, Impacto, Pedido, Productor } from './models';
import { FiltrosPedidos, parametrosDePedidos } from './pedidos-service';

/** Decisiones que la fundación puede tomar sobre un productor PENDIENTE (SPEC 5). */
export type DecisionVerificacion = Exclude<EstadoVerificacion, 'PENDIENTE'>;

/** Recursos de la fundación (ADMIN). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/admin`;

  productores(estado?: EstadoVerificacion): Observable<Productor[]> {
    const params = estado ? new HttpParams().set('estado', estado) : undefined;
    return this.http.get<Productor[]>(`${this.base}/productores`, { params });
  }

  verificar(id: number, estado: DecisionVerificacion): Observable<Productor> {
    return this.http.patch<Productor>(`${this.base}/productores/${id}/verificacion`, { estado });
  }

  pedidos(filtros: FiltrosPedidos = {}): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.base}/pedidos`, {
      params: parametrosDePedidos(filtros),
    });
  }

  impacto(): Observable<Impacto> {
    return this.http.get<Impacto>(`${this.base}/reportes/impacto`);
  }
}
