namespace TourPlanner.Dtos.Tours;

public record TourResponse(
  int Id,
  int UserId,
  string Name,
  string? Description,
  string? From,
  string? To,
  string? TransportType,
  double DistanceKm,
  int EstimatedTimeMinutes,
  DateTime CreatedAt);
