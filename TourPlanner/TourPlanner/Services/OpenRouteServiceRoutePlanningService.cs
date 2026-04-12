using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TourPlanner.Dtos.Tours;
using TourPlanner.Models;

namespace TourPlanner.Services;

public class OpenRouteServiceRoutePlanningService : IRoutePlanningService
{
  private readonly HttpClient _httpClient;
  private readonly OpenRouteServiceSettings _settings;

  public OpenRouteServiceRoutePlanningService(HttpClient httpClient, IOptions<OpenRouteServiceSettings> settings)
  {
    _httpClient = httpClient;
    _settings = settings.Value;
  }

  public async Task<TourPlanResponse> PlanAsync(TourPlanRequest request, CancellationToken cancellationToken)
  {
    if (string.IsNullOrWhiteSpace(_settings.ApiKey))
    {
      return BuildFallbackPlan(request);
    }

    var from = await GeocodeAsync(request.From, cancellationToken);
    var to = await GeocodeAsync(request.To, cancellationToken);
    var geometry = await GetDirectionsAsync(request, from, to, cancellationToken);

    return geometry;
  }

  private async Task<TourPlanResponse> GetDirectionsAsync(TourPlanRequest request, (double Latitude, double Longitude) from, (double Latitude, double Longitude) to, CancellationToken cancellationToken)
  {
    var profile = NormalizeProfile(request.TransportType);
    var url = $"{_settings.BaseUrl.TrimEnd('/')}/v2/directions/{profile}/geojson";
    using var response = await _httpClient.PostAsync(url, new StringContent(JsonSerializer.Serialize(new
    {
      coordinates = new[] { new[] { from.Longitude, from.Latitude }, new[] { to.Longitude, to.Latitude } }
    }), System.Text.Encoding.UTF8, "application/json"), cancellationToken);

    response.EnsureSuccessStatusCode();
    using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
    var feature = doc.RootElement.GetProperty("features")[0];
    var summary = feature.GetProperty("properties").GetProperty("summary");
    var coords = feature.GetProperty("geometry").GetProperty("coordinates");

    var geometry = coords.EnumerateArray().Select(x => new TourRoutePointResponse(x[1].GetDouble(), x[0].GetDouble())).ToList();
    return new TourPlanResponse(
      request.From,
      request.To,
      request.TransportType,
      Math.Round(summary.GetProperty("distance").GetDouble() / 1000.0, 2),
      (int)Math.Round(summary.GetProperty("duration").GetDouble() / 60.0),
      geometry,
      "openrouteservice");
  }

  private async Task<(double Latitude, double Longitude)> GeocodeAsync(string query, CancellationToken cancellationToken)
  {
    var url = $"{_settings.BaseUrl.TrimEnd('/')}/geocode/search?text={Uri.EscapeDataString(query)}&size=1";
    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);

    using var response = await _httpClient.SendAsync(request, cancellationToken);
    response.EnsureSuccessStatusCode();
    using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
    var coord = doc.RootElement.GetProperty("features")[0].GetProperty("geometry").GetProperty("coordinates");
    return (coord[1].GetDouble(), coord[0].GetDouble());
  }

  private static string NormalizeProfile(string transportType)
    => transportType.Trim().ToLowerInvariant() switch
    {
      "bike" or "bicycle" or "cycling" => "cycling-regular",
      "run" or "running" => "foot-hiking",
      _ => "foot-walking",
    };

  private static TourPlanResponse BuildFallbackPlan(TourPlanRequest request)
  {
    var from = HashCoordinate(request.From, -1);
    var to = HashCoordinate(request.To, 1);
    var geometry = new List<TourRoutePointResponse>
    {
      new(from.Latitude, from.Longitude),
      new((from.Latitude + to.Latitude) / 2.0 + 0.01, (from.Longitude + to.Longitude) / 2.0 - 0.01),
      new(to.Latitude, to.Longitude),
    };

    var distanceKm = Math.Round(HaversineKm(from, to), 2);
    var speedKmh = NormalizeProfile(request.TransportType) switch
    {
      "cycling-regular" => 18.0,
      "foot-hiking" => 5.0,
      _ => 4.5,
    };

    return new TourPlanResponse(
      request.From,
      request.To,
      request.TransportType,
      distanceKm,
      (int)Math.Round(distanceKm / speedKmh * 60.0),
      geometry,
      "fallback");
  }

  private static (double Latitude, double Longitude) HashCoordinate(string text, int direction)
  {
    var hash = text.GetHashCode(StringComparison.Ordinal);
    var baseLat = 48.0 + ((hash & 0xFF) / 255.0) * 8.0;
    var baseLon = 8.0 + (((hash >> 8) & 0xFF) / 255.0) * 8.0;
    return (baseLat + direction * 0.03, baseLon + direction * 0.03);
  }

  private static double HaversineKm((double Latitude, double Longitude) from, (double Latitude, double Longitude) to)
  {
    const double r = 6371.0;
    var dLat = DegreesToRadians(to.Latitude - from.Latitude);
    var dLon = DegreesToRadians(to.Longitude - from.Longitude);
    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) + Math.Cos(DegreesToRadians(from.Latitude)) * Math.Cos(DegreesToRadians(to.Latitude)) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
    return 2 * r * Math.Asin(Math.Sqrt(a));

    static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;
  }
}
