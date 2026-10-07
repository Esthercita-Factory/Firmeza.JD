import { Component, ElementRef, inject } from '@angular/core';

type CampoError = 'correo' | 'clave' | 'ambos';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  /** Aviso informado por LoginController.Index (POST) a través de la vista Razor. */
  readonly error: string;

  /** Campo que debe quedar marcado con is-invalid. */
  readonly campoError: CampoError | null;

  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;

    this.error = host.getAttribute('data-error')?.trim() ?? '';

    const campo = host.getAttribute('data-campo')?.trim();
    this.campoError =
      campo === 'correo' || campo === 'clave' || campo === 'ambos' ? campo : null;
  }

  get correoInvalido(): boolean {
    return this.campoError === 'correo' || this.campoError === 'ambos';
  }

  get claveInvalida(): boolean {
    return this.campoError === 'clave' || this.campoError === 'ambos';
  }
}
