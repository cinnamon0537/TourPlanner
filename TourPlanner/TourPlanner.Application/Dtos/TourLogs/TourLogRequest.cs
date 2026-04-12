using System.ComponentModel.DataAnnotations;

namespace TourPlanner.Dtos.TourLogs;

public class TourLogRequest
{
  public DateTime LogDateTime { get; set; } = DateTime.UtcNow;

  public string? Comment { get; set; }

  [Required]
  public string Difficulty { get; set; } = string.Empty;

  [Range(0, double.MaxValue)]
  public double TotalDistanceKm { get; set; }

  [Range(1, int.MaxValue)]
  public int TotalTimeMinutes { get; set; }

  [Range(1, 5)]
  public int? Rating { get; set; }
}
