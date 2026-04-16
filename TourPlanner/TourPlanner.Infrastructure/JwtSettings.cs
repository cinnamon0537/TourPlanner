namespace TourPlanner.Models;

public class JwtSettings
{
  public const string SectionName = "Jwt";
  public string Issuer { get; set; } = "TourPlanner";
  public string Audience { get; set; } = "TourPlanner";
  public string Key { get; set; } = string.Empty;
  public int ExpiryMinutes { get; set; } = 120;
}
