namespace TourPlanner.Models;

public class OpenRouteServiceSettings
{
  public const string SectionName = "OpenRouteService";

  public string ApiKey { get; set; } = string.Empty;
  public string BaseUrl { get; set; } = "https://api.openrouteservice.org";
}
