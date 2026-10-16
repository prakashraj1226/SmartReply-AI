import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  showUpgrade?: boolean;
  upgradeText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  readonly isOpen = signal<boolean>(false);
  readonly options = signal<ConfirmOptions | null>(null);

  private resolver: ((value: boolean) => void) | null = null;

  confirm(options: ConfirmOptions): Promise<boolean> {
    const isLimit = options.showUpgrade ?? (
      (options.title?.toLowerCase().includes('limit') ?? false) ||
      options.message.toLowerCase().includes('plan limit') ||
      options.message.toLowerCase().includes('allows a maximum')
    );
    this.options.set({
      title: options.title || 'Are you sure?',
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText !== undefined ? options.cancelText : 'Cancel',
      type: options.type || 'danger',
      showUpgrade: isLimit,
      upgradeText: options.upgradeText || 'Upgrade Plan'
    });
    this.isOpen.set(true);

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  alert(
    message: string,
    title = 'Notification',
    type: 'info' | 'success' | 'warning' | 'danger' = 'info',
    showUpgrade = false
  ): Promise<boolean> {
    const isLimit = showUpgrade ||
      title.toLowerCase().includes('limit') ||
      message.toLowerCase().includes('plan limit') ||
      message.toLowerCase().includes('allows a maximum');
    return this.confirm({
      title,
      message,
      confirmText: 'Got It',
      cancelText: '',
      type,
      showUpgrade: isLimit,
      upgradeText: 'Upgrade Plan'
    });
  }

  close(confirmed: boolean): void {
    this.isOpen.set(false);
    if (this.resolver) {
      this.resolver(confirmed);
      this.resolver = null;
    }
  }
}
