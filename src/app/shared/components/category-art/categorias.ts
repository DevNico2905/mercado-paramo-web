export interface ArteCategoria {
  emoji: string;
  /** Clases del degradado de fondo. */
  fondo: string;
  /** Clase de color del halo detrás del emoji. */
  halo: string;
}

const ARTES: Record<string, ArteCategoria> = {
  tuberculos: {
    emoji: '🥔',
    fondo: 'from-frailejon-100 via-[#ead9bd] to-[#d9bfa0]',
    halo: 'bg-tierra-600/25',
  },
  lacteos: {
    emoji: '🧀',
    fondo: 'from-white via-frailejon-100 to-[#f3dc92]',
    halo: 'bg-frailejon-400/35',
  },
  frutas: {
    emoji: '🍓',
    fondo: 'from-frailejon-100 via-[#f6d9cb] to-[#eeb9ad]',
    halo: 'bg-peligro-600/20',
  },
  hortalizas: {
    emoji: '🥬',
    fondo: 'from-niebla-50 via-musgo-100 to-[#b9d3c0]',
    halo: 'bg-musgo-700/25',
  },
  'hierbas y aromaticas': {
    emoji: '🌿',
    fondo: 'from-frailejon-100 via-musgo-100 to-[#c5dbc0]',
    halo: 'bg-musgo-700/20',
  },
};

const OTRA: ArteCategoria = {
  emoji: '🌾',
  fondo: 'from-niebla-50 via-frailejon-100 to-[#e6d3a3]',
  halo: 'bg-frailejon-400/30',
};

function normalizar(nombre: string): string {
  return nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/** Arte de una categoría según su nombre (SPEC 3.3). Las desconocidas usan 🌾. */
export function arteDeCategoria(nombre: string | null | undefined): ArteCategoria {
  return ARTES[normalizar(nombre ?? '')] ?? OTRA;
}
