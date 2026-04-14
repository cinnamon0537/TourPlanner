namespace TourPlanner.Dtos.Tours;

public record TourSearchResponse(
  int Id,
  int UserId,
  string Name,
  string? Description,
  string? Image,
  string? From,
  string? To,
  string? TransportType,
  double DistanceKm,
  int EstimatedTimeMinutes,
  DateTime CreatedAt,
  int Popularity,
  double ChildFriendlinessScore,
  string MatchSummary);
