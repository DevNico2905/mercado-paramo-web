import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  viewChild,
} from '@angular/core';
import { ConfirmService } from '../../../core/ui/confirm-service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    afterRenderEffect(() => {
      const abierto = this.confirm.solicitud() !== null;
      const elemento = this.dialogo().nativeElement;
      if (abierto && !elemento.open) {
        elemento.showModal();
      } else if (!abierto && elemento.open) {
        elemento.close();
      }
    });
  }
}
