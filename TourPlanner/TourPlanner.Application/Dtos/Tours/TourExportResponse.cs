namespace TourPlanner.Dtos.Tours;

public record TourExportResponse(IReadOnlyList<TourExportTourResponse> Tours);

public record TourExportTourResponse(
  int Id,
  string Name,
  string? Description,
  string? From,
  string? To,
  string? TransportType,
  double DistanceKm,
  int EstimatedTimeMinutes,
  DateTime CreatedAt,
  IReadOnlyList<TourExportLogResponse> Logs);

public record TourExportLogResponse(
  DateTime LogDateTime,
  string? Comment,
  string Difficulty,
  double TotalDistanceKm,
  int TotalTimeMinutes,
  int? Rating,
  DateTime CreatedAt);
