import { Rol } from '../api/models';

const INICIOS: Record<Rol, string> = {
  COMPRADOR: '/',
  PRODUCTOR: '/productor/pedidos',
  ADMIN: '/admin/productores',
};

export function inicioPorRol(rol: Rol | null | undefined): string {
  return rol ? INICIOS[rol] : '/';
}
