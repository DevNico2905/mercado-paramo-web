import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria, Producto } from './models';

export interface FiltrosCatalogo {
  categoriaId?: number | null;
  productorId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.base}/categorias`);
  }

  productos(filtros: FiltrosCatalogo = {}): Observable<Producto[]> {
    let params = new HttpParams();
    if (filtros.categoriaId != null) {
      params = params.set('categoriaId', filtros.categoriaId);
    }
    if (filtros.productorId != null) {
      params = params.set('productorId', filtros.productorId);
    }
    return this.http.get<Producto[]>(`${this.base}/productos`, { params });
  }

  producto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.base}/productos/${id}`);
  }
}
