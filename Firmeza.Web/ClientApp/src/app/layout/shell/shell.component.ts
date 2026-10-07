import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  template: `
    <div class="d-flex h-100" style="min-height: 100vh;">
      <app-sidebar class="d-none d-lg-block"></app-sidebar>
      <div class="flex-grow-1 d-flex flex-column" style="overflow-x: hidden;">
        <app-navbar></app-navbar>
        <main class="flex-grow-1 p-4" style="overflow-y: auto;">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
    }
  `]
})
export class ShellComponent {}
