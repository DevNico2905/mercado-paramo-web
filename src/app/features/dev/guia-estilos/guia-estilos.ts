import { ChangeDetectionStrategy, Component } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CopPipe } from '../../../shared/pipes/cop-pipe';

interface Muestra {
  token: string;
  hex: string;
  uso: string;
  clases: string;
}

@Component({
  selector: 'app-guia-estilos',
  imports: [CopPipe],
  templateUrl: './guia-estilos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuiaEstilos {
  protected readonly apiUrl = environment.apiUrl;
  protected readonly total = 24000;
  protected readonly montoProductor = 22800;

  protected readonly paleta: Muestra[] = [
    { token: 'musgo-900', hex: '#1E3B2D', uso: 'Texto fuerte, encabezados, header', clases: 'bg-musgo-900 text-white' },
    { token: 'musgo-700', hex: '#2F5D46', uso: 'Primario: botones principales, enlaces', clases: 'bg-musgo-700 text-white' },
    { token: 'musgo-100', hex: '#E3EDE6', uso: 'Fondos suaves, chips seleccionados', clases: 'bg-musgo-100 text-musgo-900' },
    { token: 'frailejon-400', hex: '#E8B931', uso: 'Acento: destacados, impacto, badges', clases: 'bg-frailejon-400 text-musgo-900' },
    { token: 'frailejon-100', hex: '#FBF1D3', uso: 'Fondos de avisos positivos', clases: 'bg-frailejon-100 text-musgo-900' },
    { token: 'tierra-600', hex: '#8C5A3C', uso: 'Secundario, detalles', clases: 'bg-tierra-600 text-white' },
    { token: 'niebla-50', hex: '#F5F3EC', uso: 'Fondo general de la app', clases: 'bg-niebla-50 text-roca-900' },
    { token: 'roca-900', hex: '#2B2B26', uso: 'Texto de cuerpo', clases: 'bg-roca-900 text-white' },
    { token: 'peligro-600', hex: '#B42318', uso: 'Errores, rechazar, cancelar', clases: 'bg-peligro-600 text-white' },
  ];
}
