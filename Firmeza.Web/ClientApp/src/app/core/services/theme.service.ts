import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public isDarkMode = signal<boolean>(true); // Modo oscuro principal por defecto
  private readonly THEME_KEY = 'firmeza-theme';

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const storedTheme = localStorage.getItem(this.THEME_KEY);
    
    // Si el usuario guardó 'light', aplicamos modo claro; en cualquier otro caso modo oscuro (principal)
    if (storedTheme === 'light') {
      this.setDarkMode(false);
    } else {
      this.setDarkMode(true);
    }
  }

  public toggleTheme(): void {
    this.setDarkMode(!this.isDarkMode());
  }

  public setDarkMode(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');

    if (isDark) {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    } else {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    }
  }
}
