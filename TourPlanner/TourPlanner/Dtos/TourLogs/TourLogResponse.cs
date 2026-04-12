namespace TourPlanner.Dtos.TourLogs;

public record TourLogResponse(
  int Id,
  int TourId,
  DateTime LogDateTime,
  string? Comment,
  string Difficulty,
  double TotalDistanceKm,
  int TotalTimeMinutes,
  int? Rating,
  DateTime CreatedAt);
