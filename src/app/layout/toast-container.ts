import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX } from '@lucide/icons';
import { iconos } from '../shared/iconos';
import { ToastService } from '../core/ui/toast-service';

@Component({
  selector: 'app-toast-container',
  imports: [LucideDynamicIcon],
  templateUrl: './toast-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  protected readonly iconos = iconos({ LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX });

  protected readonly toastService = inject(ToastService);
}
