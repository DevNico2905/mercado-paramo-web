import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideLogOut } from '@lucide/icons';
import { Perfil } from '../core/api/models';
import { ETIQUETA_ROL, iniciales, primerNombre } from '../core/auth/rol';
import { iconos } from '../shared/iconos';

let siguienteId = 0;

/**
 * Identidad del usuario en sesión: avatar con iniciales (y saludo en escritorio) que abre un
 * panel con el nombre, el correo y "Salir". Se cierra con Esc, con clic afuera o al salir
 * del panel con el teclado.
 */
@Component({
  selector: 'app-user-menu',
  imports: [LucideDynamicIcon],
  templateUrl: './user-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block',
    '(document:click)': 'clicAfuera($event)',
    '(keydown.escape)': 'cerrar(true)',
    '(focusout)': 'focoAfuera($event)',
  },
})
export class UserMenu {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly disparador = viewChild.required<ElementRef<HTMLButtonElement>>('disparador');
  private readonly botonSalir = viewChild<ElementRef<HTMLButtonElement>>('botonSalir');

  readonly perfil = input.required<Perfil>();
  readonly salir = output<void>();

  protected readonly iconos = iconos({ LucideLogOut });
  protected readonly panelId = `menu-usuario-${siguienteId++}`;
  protected readonly abierto = signal(false);

  protected readonly iniciales = computed(() => iniciales(this.perfil().nombre));
  protected readonly primerNombre = computed(() => primerNombre(this.perfil().nombre));
  protected readonly rol = computed(() => ETIQUETA_ROL[this.perfil().rol]);

  protected alternar(): void {
    if (this.abierto()) {
      this.cerrar(false);
      return;
    }
    this.abierto.set(true);
    queueMicrotask(() => setTimeout(() => this.botonSalir()?.nativeElement.focus()));
  }

  protected cerrar(devolverFoco: boolean): void {
    if (!this.abierto()) {
      return;
    }
    this.abierto.set(false);
    if (devolverFoco) {
      this.disparador().nativeElement.focus();
    }
  }

  protected clicAfuera(evento: MouseEvent): void {
    if (this.abierto() && !this.host.nativeElement.contains(evento.target as Node | null)) {
      this.cerrar(false);
    }
  }

  protected focoAfuera(evento: FocusEvent): void {
    const destino = evento.relatedTarget as Node | null;
    if (destino && !this.host.nativeElement.contains(destino)) {
      this.cerrar(false);
    }
  }

  protected confirmarSalida(): void {
    this.abierto.set(false);
    this.salir.emit();
  }
}
