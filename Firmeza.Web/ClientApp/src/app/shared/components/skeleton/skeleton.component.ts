import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-loader" [ngStyle]="{'width': width, 'height': height, 'border-radius': borderRadius}"></div>
  `,
  styles: [`
    .skeleton-loader {
      background: linear-gradient(90deg, var(--bg-base) 25%, var(--border-color) 50%, var(--bg-base) 75%);
      background-size: 200% 100%;
      animation: skeletonLoading 1.5s infinite;
      opacity: 0.7;
    }
    
    @keyframes skeletonLoading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonComponent {
  @Input() width: string = '100%';
  @Input() height: string = '20px';
  @Input() borderRadius: string = '4px';
}
