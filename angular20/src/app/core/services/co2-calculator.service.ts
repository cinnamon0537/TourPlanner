import { Injectable } from '@angular/core';

/** Durchschnittlicher PKW-Ausstoß in kg CO₂ pro km (Referenz für Einsparungsberechnung). */
export const CAR_CO2_KG_PER_KM = 0.21;

@Injectable({ providedIn: 'root' })
export class Co2CalculatorService {
  /** Strategy Map: Transporttyp → Einsparungsfaktor gegenüber Auto (kg CO₂/km). */
  private readonly savingFactorByTransport: Record<string, number> = {
    car: 0,
    bike: CAR_CO2_KG_PER_KM,
    bicycle: CAR_CO2_KG_PER_KM,
    cycling: CAR_CO2_KG_PER_KM,
    walking: CAR_CO2_KG_PER_KM,
    walk: CAR_CO2_KG_PER_KM,
    hike: CAR_CO2_KG_PER_KM,
    hiking: CAR_CO2_KG_PER_KM,
    running: CAR_CO2_KG_PER_KM,
    run: CAR_CO2_KG_PER_KM,
  };

  calculateSaving(distanceKm: number | undefined | null, transportType: string | null | undefined): number {
    const distance = distanceKm ?? 0;
    if (distance <= 0) {
      return 0;
    }

    const factor = this.savingFactorByTransport[this.normalizeTransport(transportType)] ?? CAR_CO2_KG_PER_KM;
    return this.roundKg(distance * factor);
  }

  calculateTotalSaving(tours: Array<{ distanceKm?: number; transportType?: string | null }>): number {
    const total = tours.reduce(
      (sum, tour) => sum + this.calculateSaving(tour.distanceKm, tour.transportType),
      0,
    );
    return this.roundKg(total);
  }

  private normalizeTransport(transportType: string | null | undefined): string {
    return (transportType ?? '').trim().toLowerCase();
  }

  private roundKg(value: number): number {
    return Math.round(value * 10) / 10;
  }
}
