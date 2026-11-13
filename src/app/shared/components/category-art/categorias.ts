export interface ArteCategoria {
  /**
   * Emojis de referencia en el orden en que se pintan (izquierda → derecha). Son varios para
   * que se lea la categoría completa y no un producto puntual; con tres, el del centro es el
   * principal.
   */
  emojis: readonly string[];
  /** Clases del degradado de fondo. */
  fondo: string;
  /** Clase de color del halo detrás de los emojis. */
  halo: string;
}

const ARTES: Record<string, ArteCategoria> = {
  tuberculos: {
    emojis: ['🍠', '🥔'],
    fondo: 'from-frailejon-100 via-[#ead9bd] to-[#d9bfa0]',
    halo: 'bg-tierra-600/25',
  },
  lacteos: {
    emojis: ['🥛', '🧀', '🧈'],
    fondo: 'from-white via-frailejon-100 to-[#f3dc92]',
    halo: 'bg-frailejon-400/35',
  },
  frutas: {
    emojis: ['🍎', '🍓', '🍌'],
    fondo: 'from-frailejon-100 via-[#f6d9cb] to-[#eeb9ad]',
    halo: 'bg-peligro-600/20',
  },
  hortalizas: {
    emojis: ['🍅', '🥬', '🥦'],
    fondo: 'from-niebla-50 via-musgo-100 to-[#b9d3c0]',
    halo: 'bg-musgo-700/25',
  },
  'hierbas y aromaticas': {
    emojis: ['🍃', '🌿', '🌱'],
    fondo: 'from-frailejon-100 via-musgo-100 to-[#c5dbc0]',
    halo: 'bg-musgo-700/20',
  },
};

const OTRA: ArteCategoria = {
  emojis: ['🌾'],
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
