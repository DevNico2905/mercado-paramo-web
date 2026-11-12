import { components } from './schema';

type Schemas = components['schemas'];

export type Perfil = Schemas['PerfilResponse'];
export type Rol = NonNullable<Perfil['rol']>;
export type EstadoVerificacion = NonNullable<Perfil['estadoVerificacion']>;
export type LoginRequest = Schemas['LoginRequest'];
export type LoginResponse = Schemas['LoginResponse'];
