import { bootstrapApplication } from '@angular/platform-browser';

import { HomeComponent } from './app/home/home.component';
import { LoginComponent } from './app/login/login.component';

/**
 * Cada vista Razor monta un solo componente. Como la aplicación es una MPA sin
 * router, el bundle se monta leyendo qué etiqueta existe en el documento.
 */
function montar(): void {
  const hayLogin = document.querySelector('app-login') !== null;
  const hayHome = document.querySelector('app-home') !== null;

  if (!hayLogin && !hayHome) {
    return;
  }

  const componente = hayLogin ? LoginComponent : HomeComponent;

  bootstrapApplication(componente).catch((error: unknown) =>
    console.error('No se pudo montar el componente de Firmeza.', error),
  );
}

montar();
