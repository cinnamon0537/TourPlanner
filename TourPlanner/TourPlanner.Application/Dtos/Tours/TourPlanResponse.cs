namespace TourPlanner.Dtos.Tours;

public record TourPlanResponse(
  string From,
  string To,
  string TransportType,
  double DistanceKm,
  int EstimatedTimeMinutes,
  IReadOnlyList<TourRoutePointResponse> Geometry,
  string Source);
