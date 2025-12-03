import {
  Type,
  ApplicationRef,
  ComponentRef,
  EmbeddedViewRef,
  createComponent,
  EnvironmentInjector,
} from '@angular/core';

export interface OverlayConfig<T = any> {
  target?: HTMLElement;
  backdropOpacity?: number;
  data?: Partial<T>;
  offsetX?: number;
  offsetY?: number;
}

export class OverlayRef<T extends object = any> {
  private componentRef!: ComponentRef<T>;
  private overlayContainer!: HTMLElement;

  private _updateBound!: () => void;
  private _escListener!: (e: KeyboardEvent) => void;

  constructor(
    private component: Type<T>,
    private config: OverlayConfig<T> = {},
    private appRef: ApplicationRef,
    private envInjector: EnvironmentInjector
  ) {}

  open() {
    this.overlayContainer = document.createElement('div');
    Object.assign(this.overlayContainer.style, {
      position: 'fixed',
      zIndex: '1000',
    });
    document.body.appendChild(this.overlayContainer);

    this.componentRef = createComponent(this.component, {
      environmentInjector: this.envInjector,
    });

    if (this.config.data) {
      Object.assign(this.componentRef.instance as any, this.config.data);
    }

    this.appRef.attachView(this.componentRef.hostView);
    const domElem = (this.componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;

    this.overlayContainer.appendChild(domElem);

    this.updatePosition();

    this._updateBound = this.updatePosition.bind(this);

    window.addEventListener('resize', this._updateBound);
    window.addEventListener('scroll', this._updateBound);

    this._escListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') this.close();
    };
    window.addEventListener('keydown', this._escListener);
  }

  private updatePosition() {
    if (!this.config.target) return;

    const rect = this.config.target.getBoundingClientRect();
    const offsetX = this.config.offsetX ?? 0;
    const offsetY = this.config.offsetY ?? 0;

    this.overlayContainer.style.left = rect.left + offsetX + 'px';
    this.overlayContainer.style.top = rect.bottom + offsetY + 'px';
  }

  close = () => {
    window.removeEventListener('keydown', this._escListener);
    window.removeEventListener('resize', this._updateBound);
    window.removeEventListener('scroll', this._updateBound);

    this.appRef.detachView(this.componentRef.hostView);
    this.componentRef.destroy();
    this.overlayContainer.remove();

    this.onCloseCallback?.();

    (document.activeElement as HTMLElement)?.blur();
  };

  private onCloseCallback?: () => void;

  onClose(cb: () => void) {
    this.onCloseCallback = cb;
  }
}
