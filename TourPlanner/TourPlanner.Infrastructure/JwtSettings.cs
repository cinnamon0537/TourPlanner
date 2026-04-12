namespace TourPlanner.Models;

public class JwtSettings
{
  public const string SectionName = "Jwt";
  public string Issuer { get; set; } = "TourPlanner";
  public string Audience { get; set; } = "TourPlanner";
  public string Key { get; set; } = "change-this-key-at-least-32-characters-long";
  public int ExpiryMinutes { get; set; } = 120;
}
