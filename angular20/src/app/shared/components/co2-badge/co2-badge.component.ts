import { DecimalPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { Co2CalculatorService } from '../../../core/services/co2-calculator.service';

@Component({
  selector: 'app-co2-badge',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @if (saving > 0) {
      <span class="co2-badge">{{ saving | number:'1.1-1' }} kg CO₂ gespart</span>
    }
  `,
  styles: [`
    .co2-badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      background: #ecfdf5;
      color: #047857;
      font-size: 0.78rem;
      font-weight: 600;
    }
  `],
})
export class Co2BadgeComponent {
  @Input({ required: true }) distanceKm!: number;
  @Input({ required: true }) transportType!: string;

  private co2Calculator = inject(Co2CalculatorService);

  get saving(): number {
    return this.co2Calculator.calculateSaving(this.distanceKm, this.transportType);
  }
}
