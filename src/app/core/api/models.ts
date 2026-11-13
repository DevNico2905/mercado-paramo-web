import { components } from './schema';

type Schemas = components['schemas'];

/**
 * Respuesta de la API. openapi.json no marca campos obligatorios en las respuestas, pero la
 * API siempre los envía todos, así que se tipan como requeridos. Los campos que sí pueden
 * venir nulos se declaran en `Nulos`.
 */
type Respuesta<T, Nulos extends keyof T = never> = {
  [K in Exclude<keyof T, Nulos>]-?: NonNullable<T[K]>;
} & {
  [K in Nulos]-?: NonNullable<T[K]> | null;
};

export type LoginRequest = Schemas['LoginRequest'];
export type RegistroRequest = Schemas['RegistroRequest'];
export type ProductoRequest = Schemas['ProductoRequest'];
export type PedidoRequest = Schemas['PedidoRequest'];
export type ItemPedidoRequest = Schemas['ItemPedidoRequest'];
export type CambioEstadoRequest = Schemas['CambioEstadoRequest'];
export type VerificacionRequest = Schemas['VerificacionRequest'];

export type LoginResponse = Respuesta<Schemas['LoginResponse']>;
export type RegistroResponse = Respuesta<Schemas['RegistroResponse'], 'estadoVerificacion'>;
export type Perfil = Respuesta<Schemas['PerfilResponse'], 'estadoVerificacion' | 'vereda'>;
export type Categoria = Respuesta<Schemas['CategoriaResponse']>;
export type Producto = Respuesta<Schemas['ProductoResponse']>;
export type Productor = Respuesta<Schemas['ProductorResponse']>;
export type DetallePedido = Respuesta<Schemas['DetallePedidoResponse']>;
export type Pedido = Omit<Respuesta<Schemas['PedidoResponse']>, 'detalles'> & {
  detalles: DetallePedido[];
};
export type VentaProducto = Respuesta<Schemas['VentaProductoResponse']>;
export type ReporteVentas = Omit<
  Respuesta<Schemas['ReporteVentasResponse'], 'participacionPorcentaje'>,
  'productos'
> & {
  productos: VentaProducto[];
};
export type Impacto = Respuesta<Schemas['ImpactoResponse'], 'participacionPorcentaje'>;

export type Rol = Perfil['rol'];
export type EstadoVerificacion = NonNullable<Perfil['estadoVerificacion']>;
export type EstadoPedido = Pedido['estado'];
