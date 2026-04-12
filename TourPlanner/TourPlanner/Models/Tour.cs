namespace TourPlanner.Models;

public class Tour
{
  public int Id { get; set; }
  public int UserId { get; set; }
  public AppUser? User { get; set; }
  public string Name { get; set; } = string.Empty;
  public string? Description { get; set; }
  public string? From { get; set; }
  public string? To { get; set; }
  public string? TransportType { get; set; }
  public double DistanceKm { get; set; }
  public int EstimatedTimeMinutes { get; set; }
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
