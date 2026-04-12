using System.ComponentModel.DataAnnotations;

namespace TourPlanner.Dtos.Tours;

public record TourRequest(
  [property: Required, MinLength(3)] string Name,
  string? Description,
  string? From,
  string? To,
  string? TransportType,
  double DistanceKm,
  int EstimatedTimeMinutes);
