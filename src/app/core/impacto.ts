/** Participación del productor en cada venta: la plataforma retiene un 5 % (SPEC 1). */
export const PARTICIPACION_PRODUCTOR = 0.95;

/** Porcentaje que recibe el productor cuando vende con intermediarios (SPEC 1). */
export const PARTICIPACION_CON_INTERMEDIARIOS = { minimo: 15, maximo: 25 } as const;
