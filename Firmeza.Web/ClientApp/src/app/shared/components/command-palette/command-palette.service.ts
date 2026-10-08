import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommandPaletteService {
  isOpen = signal<boolean>(false);

  constructor() {
    this.registerGlobalListener();
  }

  private registerGlobalListener(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen()) {
        e.preventDefault();
        this.close();
      }
    });
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }
}
