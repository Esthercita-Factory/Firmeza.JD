import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-shimmer" 
         [ngStyle]="{
           'width': width, 
           'height': height, 
           'border-radius': borderRadius,
           'margin-bottom': marginBottom
         }">
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .skeleton-shimmer {
      background: linear-gradient(
        90deg, 
        var(--bg-panel-hover) 0%, 
        var(--border-highlight) 50%, 
        var(--bg-panel-hover) 100%
      );
      background-size: 200% 100%;
      animation: hudShimmer 1.6s infinite ease-in-out;
      opacity: 0.75;
    }

    @keyframes hudShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonComponent {
  @Input() width: string = '100%';
  @Input() height: string = '20px';
  @Input() borderRadius: string = '6px';
  @Input() marginBottom: string = '0';
}
