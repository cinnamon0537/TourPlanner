using System.ComponentModel.DataAnnotations;

namespace TourPlanner.Dtos.Tours;

public class TourImportRequest
{
  [Required]
  public List<TourImportItem> Tours { get; set; } = [];
}

public class TourImportItem
{
  [Required, MinLength(3)]
  public string Name { get; set; } = string.Empty;

  public string? Description { get; set; }
  public string? From { get; set; }
  public string? To { get; set; }
  public string? TransportType { get; set; }
  public double DistanceKm { get; set; }
  public int EstimatedTimeMinutes { get; set; }
}
