export interface TourSearchItemDto {
  id?: number;
  userId?: number;
  name?: string | null;
  description?: string | null;
  image?: string | null;
  from?: string | null;
  to?: string | null;
  transportType?: string | null;
  distanceKm?: number;
  estimatedTimeMinutes?: number;
  createdAt?: string;
  popularity?: number;
  childFriendlinessScore?: number;
  matchSummary?: string | null;
}

export interface TourRoutePointDto {
  latitude: number;
  longitude: number;
}

export interface TourPlanDto {
  from: string;
  to: string;
  transportType: string;
  distanceKm: number;
  estimatedTimeMinutes: number;
  geometry: TourRoutePointDto[];
  source: string;
}

export interface TourExportDto {
  tours: Array<{
    id: number;
    name: string;
    description?: string | null;
    image?: string | null;
    from?: string | null;
    to?: string | null;
    transportType?: string | null;
    distanceKm: number;
    estimatedTimeMinutes: number;
    createdAt: string;
    logs: Array<{
      logDateTime: string;
      comment?: string | null;
      difficulty: string;
      totalDistanceKm: number;
      totalTimeMinutes: number;
      rating?: number | null;
      createdAt: string;
    }>;
  }>;
}
