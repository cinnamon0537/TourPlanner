namespace TourPlanner.Models;

public class TourLog
{
  public int Id { get; set; }
  public int TourId { get; set; }
  public Tour? Tour { get; set; }
  public DateTime LogDateTime { get; set; } = DateTime.UtcNow;
  public string? Comment { get; set; }
  public DifficultyLevel Difficulty { get; set; }
  public double TotalDistanceKm { get; set; }
  public int TotalTimeMinutes { get; set; }
  public int? Rating { get; set; }
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
