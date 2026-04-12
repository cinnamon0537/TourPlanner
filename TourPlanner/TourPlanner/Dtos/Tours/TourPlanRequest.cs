using System.ComponentModel.DataAnnotations;

namespace TourPlanner.Dtos.Tours;

public class TourPlanRequest
{
  [Required, MinLength(2)]
  public string From { get; set; } = string.Empty;

  [Required, MinLength(2)]
  public string To { get; set; } = string.Empty;

  [Required]
  public string TransportType { get; set; } = "walking";
}
