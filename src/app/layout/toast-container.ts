import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX } from '@lucide/angular';
import { ToastService } from '../core/ui/toast-service';

@Component({
  selector: 'app-toast-container',
  imports: [LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX],
  templateUrl: './toast-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}
