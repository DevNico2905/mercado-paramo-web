import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ImpactMeter } from './impact-meter';

registerLocaleData(localeEsCo);

describe('ImpactMeter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'es-CO' }] });
  });

  function texto(entradas: Record<string, unknown>): string {
    const fixture = TestBed.createComponent(ImpactMeter);
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent.replace(/\s+/g, ' ').trim();
  }

  it('completa: estima el 95 % y lo compara con los intermediarios', () => {
    const contenido = texto({
      total: 24000,
      productor: 'Pedro Rodríguez',
      vereda: 'La Concepción',
    });

    expect(contenido).toContain(
      'De tus $24.000, $22.800 llegan a Pedro en la vereda La Concepción.',
    );
    expect(contenido).toContain('En Mercado Páramo 95 %');
    expect(contenido).toContain('Con intermediarios 15–25 %');
    expect(contenido).toContain('entre $3.600 y $6.000');
  });

  it('usa el monto oficial de la API cuando se indica', () => {
    const contenido = texto({ total: 24000, montoProductor: 22799, productor: 'Pedro' });

    expect(contenido).toContain('$22.799 llegan a Pedro.');
  });

  it('compacta: una línea con el monto y el porcentaje', () => {
    const contenido = texto({ variante: 'compacta', total: 24000, productor: 'Pedro Rodríguez' });

    expect(contenido).toBe('$22.800 llegan a Pedro 95 %');
  });

  it('adapta el mensaje al productor y a la plataforma, con la participación real', () => {
    expect(
      texto({ total: 100000, montoProductor: 94500, porcentaje: 94.5, perspectiva: 'productor' }),
    ).toContain('De $100.000 vendidos, recibiste $94.500.');
    expect(texto({ total: 100000, porcentaje: 94.5, perspectiva: 'productor' })).toContain(
      '94,5 %',
    );
    expect(texto({ total: 100000, montoProductor: 95000, perspectiva: 'plataforma' })).toContain(
      '$95.000 llegaron directamente a los productores.',
    );
    expect(texto({ total: 100000, perspectiva: 'plataforma' })).toContain(
      'Con intermediarios los productores habrían recibido entre $15.000 y $25.000.',
    );
    expect(texto({ total: 100000, perspectiva: 'productor' })).toContain(
      'Con intermediarios habrías recibido entre',
    );
  });
});
