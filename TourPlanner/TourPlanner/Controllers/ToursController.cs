using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourPlanner.Data;
using TourPlanner.Dtos.Tours;
using TourPlanner.Models;
using TourPlanner.Services;

namespace TourPlanner.Controllers;

[ApiController]
[Authorize]
[Route("api/tours")]
public class ToursController : ControllerBase
{
  private readonly TourPlannerDbContext _db;
  private readonly IRoutePlanningService _routePlanningService;
  private readonly ITourImageStorageService _tourImageStorageService;

  public ToursController(TourPlannerDbContext db, IRoutePlanningService routePlanningService, ITourImageStorageService tourImageStorageService)
  {
    _db = db;
    _routePlanningService = routePlanningService;
    _tourImageStorageService = tourImageStorageService;
  }

  [HttpGet]
  public async Task<ActionResult<IEnumerable<TourResponse>>> GetAll(CancellationToken cancellationToken)
  {
    var userId = GetUserId();
    var tours = await _db.Tours
      .Where(x => x.UserId == userId)
      .OrderByDescending(x => x.CreatedAt)
      .Select(x => ToResponse(x))
      .ToListAsync(cancellationToken);

    return Ok(tours);
  }

  [HttpPost("plan")]
  public async Task<ActionResult<TourPlanResponse>> Plan(TourPlanRequest request, CancellationToken cancellationToken)
  {
    return Ok(await _routePlanningService.PlanAsync(request, cancellationToken));
  }

  [HttpGet("search")]
  public async Task<ActionResult<IEnumerable<TourSearchResponse>>> Search([FromQuery] string? q, CancellationToken cancellationToken)
  {
    var userId = GetUserId();
    var query = q?.Trim();

    var toursQuery = _db.Tours
      .Include(x => x.TourLogs)
      .Where(x => x.UserId == userId);

    if (!string.IsNullOrWhiteSpace(query))
    {
      var pattern = $"%{query}%";
      toursQuery = toursQuery.Where(tour =>
        EF.Functions.Like(tour.Name, pattern) ||
        EF.Functions.Like(tour.Description ?? string.Empty, pattern) ||
        EF.Functions.Like(tour.From ?? string.Empty, pattern) ||
        EF.Functions.Like(tour.To ?? string.Empty, pattern) ||
        EF.Functions.Like(tour.TransportType ?? string.Empty, pattern) ||
        tour.TourLogs.Any(log => EF.Functions.Like(log.Comment ?? string.Empty, pattern)));
    }

    var tours = await toursQuery.ToListAsync(cancellationToken);

    var results = tours
      .Select(tour => new
      {
        Tour = tour,
        Popularity = tour.TourLogs.Count,
        ChildFriendlinessScore = ComputeChildFriendlinessScore(tour),
        MatchSummary = BuildMatchSummary(tour, query),
        Score = ComputeSearchScore(tour, query),
      })
      .Where(x => string.IsNullOrWhiteSpace(query) || x.Score > 0)
      .OrderByDescending(x => x.Score)
      .ThenByDescending(x => x.Tour.CreatedAt)
      .Select(x => new TourSearchResponse(
        x.Tour.Id,
        x.Tour.UserId,
        x.Tour.Name,
        x.Tour.Description,
        x.Tour.Image,
        x.Tour.From,
        x.Tour.To,
        x.Tour.TransportType,
        x.Tour.DistanceKm,
        x.Tour.EstimatedTimeMinutes,
        x.Tour.CreatedAt,
        x.Popularity,
        x.ChildFriendlinessScore,
        x.MatchSummary))
      .ToList();

    return Ok(results);
  }

  [HttpGet("{id:int}")]
  public async Task<ActionResult<TourResponse>> GetById(int id, CancellationToken cancellationToken)
  {
    var userId = GetUserId();
    var tour = await _db.Tours.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
    return tour == null ? NotFound() : Ok(ToResponse(tour));
  }

  [HttpPost]
  public async Task<ActionResult<TourResponse>> Create(TourRequest request, CancellationToken cancellationToken)
  {
    var userId = GetUserId();
    var tour = new Tour
    {
      UserId = userId,
      Name = request.Name,
      Description = request.Description,
      Image = request.Image,
      From = request.From,
      To = request.To,
      TransportType = request.TransportType,
      DistanceKm = request.DistanceKm,
      EstimatedTimeMinutes = request.EstimatedTimeMinutes,
    };

    _db.Tours.Add(tour);
    await _db.SaveChangesAsync(cancellationToken);

    return CreatedAtAction(nameof(GetById), new { id = tour.Id }, ToResponse(tour));
  }

  [HttpPost("image")]
  [RequestSizeLimit(10_000_000)]
  public async Task<ActionResult<object>> UploadImage([FromForm] IFormFile file, CancellationToken cancellationToken)
  {
    if (file == null || file.Length == 0)
    {
      return BadRequest("Empty file.");
    }

    var image = await _tourImageStorageService.SaveAsync(file.OpenReadStream(), file.FileName, cancellationToken);
    return Ok(new { image });
  }

  [HttpPut("{id:int}")]
  public async Task<IActionResult> Update(int id, TourRequest request, CancellationToken cancellationToken)
  {
    var userId = GetUserId();
    var tour = await _db.Tours.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
    if (tour == null)
    {
      return NotFound();
    }

    tour.Name = request.Name;
    tour.Description = request.Description;
    tour.Image = request.Image;
    tour.From = request.From;
    tour.To = request.To;
    tour.TransportType = request.TransportType;
    tour.DistanceKm = request.DistanceKm;
    tour.EstimatedTimeMinutes = request.EstimatedTimeMinutes;

    await _db.SaveChangesAsync(cancellationToken);
    return NoContent();
  }

  [HttpDelete("{id:int}")]
  public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
  {
    var userId = GetUserId();
    var tour = await _db.Tours.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
    if (tour == null)
    {
      return NotFound();
    }

    _db.Tours.Remove(tour);
    await _db.SaveChangesAsync(cancellationToken);
    return NoContent();
  }

  [HttpGet("export")]
  public async Task<ActionResult<TourExportResponse>> Export(CancellationToken cancellationToken)
  {
    var userId = GetUserId();
    var tours = await _db.Tours
      .Include(x => x.TourLogs)
      .Where(x => x.UserId == userId)
      .OrderByDescending(x => x.CreatedAt)
      .Select(x => new TourExportTourResponse(
        x.Id,
        x.Name,
        x.Description,
        x.Image,
        x.From,
        x.To,
        x.TransportType,
        x.DistanceKm,
        x.EstimatedTimeMinutes,
        x.CreatedAt,
        x.TourLogs
          .OrderByDescending(log => log.LogDateTime)
          .Select(log => new TourExportLogResponse(log.LogDateTime, log.Comment, log.Difficulty.ToString().ToLowerInvariant(), log.TotalDistanceKm, log.TotalTimeMinutes, log.Rating, log.CreatedAt))
          .ToList()))
      .ToListAsync(cancellationToken);

    return Ok(new TourExportResponse(tours));
  }

  [HttpPost("import")]
  public async Task<ActionResult<object>> Import(TourImportRequest request, CancellationToken cancellationToken)
  {
    var userId = GetUserId();
    var importedTours = 0;

    foreach (var item in request.Tours)
    {
      var tour = new Tour
      {
        UserId = userId,
        Name = item.Name,
        Description = item.Description,
        Image = item.Image,
        From = item.From,
        To = item.To,
        TransportType = item.TransportType,
        DistanceKm = item.DistanceKm,
        EstimatedTimeMinutes = item.EstimatedTimeMinutes,
      };

      _db.Tours.Add(tour);
      importedTours++;
    }

    await _db.SaveChangesAsync(cancellationToken);
    return Ok(new { importedTours });
  }

  private int GetUserId()
    => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new InvalidOperationException("Missing user id claim."));

  private static TourResponse ToResponse(Tour tour)
    => new(tour.Id, tour.UserId, tour.Name, tour.Description, tour.Image, tour.From, tour.To, tour.TransportType, tour.DistanceKm, tour.EstimatedTimeMinutes, tour.CreatedAt);

  private static int ComputeSearchScore(Tour tour, string? query)
  {
    if (string.IsNullOrWhiteSpace(query))
    {
      return 0;
    }

    var score = 0;
    AddIfMatch(tour.Name, 10);
    AddIfMatch(tour.Description, 4);
    AddIfMatch(tour.From, 3);
    AddIfMatch(tour.To, 3);
    AddIfMatch(tour.TransportType, 2);

    foreach (var log in tour.TourLogs)
    {
      AddIfMatch(log.Comment, 3);
      AddIfMatch(log.Difficulty.ToString(), 2);
      AddIfMatch(log.TotalDistanceKm.ToString(System.Globalization.CultureInfo.InvariantCulture), 1);
      AddIfMatch(log.TotalTimeMinutes.ToString(System.Globalization.CultureInfo.InvariantCulture), 1);
      AddIfMatch(log.Rating?.ToString(System.Globalization.CultureInfo.InvariantCulture), 1);
    }

    AddIfMatch(tour.TourLogs.Count.ToString(System.Globalization.CultureInfo.InvariantCulture), 2);
    AddIfMatch(ComputeChildFriendlinessScore(tour).ToString("0.#", System.Globalization.CultureInfo.InvariantCulture), 2);

    return score;

    void AddIfMatch(string? value, int points)
    {
      if (!string.IsNullOrWhiteSpace(value) && value.Contains(query, StringComparison.OrdinalIgnoreCase))
      {
        score += points;
      }
    }
  }

  private static string BuildMatchSummary(Tour tour, string? query)
  {
    if (string.IsNullOrWhiteSpace(query))
    {
      return $"{tour.TourLogs.Count} log(s)";
    }

    var matches = new List<string>();
    AddIfMatch(tour.Name, "name");
    AddIfMatch(tour.Description, "description");
    AddIfMatch(tour.From, "from");
    AddIfMatch(tour.To, "to");
    AddIfMatch(tour.TransportType, "transport");

    foreach (var log in tour.TourLogs)
    {
      AddIfMatch(log.Comment, "log comment");
      AddIfMatch(log.Difficulty.ToString(), "difficulty");
    }

    AddIfMatch(tour.TourLogs.Count.ToString(System.Globalization.CultureInfo.InvariantCulture), "popularity");
    AddIfMatch(ComputeChildFriendlinessScore(tour).ToString("0.#", System.Globalization.CultureInfo.InvariantCulture), "child-friendliness");

    return matches.Count == 0 ? "matched" : string.Join(", ", matches.Distinct());

    void AddIfMatch(string? value, string label)
    {
      if (!string.IsNullOrWhiteSpace(value) && value.Contains(query, StringComparison.OrdinalIgnoreCase))
      {
        matches.Add(label);
      }
    }
  }

  private static double ComputeChildFriendlinessScore(Tour tour)
  {
    if (tour.TourLogs.Count == 0)
    {
      return Math.Round(ScoreTourAttributes(tour.DistanceKm, tour.EstimatedTimeMinutes, DifficultyLevel.Easy), 1);
    }

    var score = tour.TourLogs.Average(log => ScoreTourAttributes(log.TotalDistanceKm, log.TotalTimeMinutes, log.Difficulty));
    return Math.Round(score, 1);
  }

  private static double ScoreTourAttributes(double distanceKm, int timeMinutes, DifficultyLevel difficulty)
  {
    var difficultyPenalty = difficulty switch
    {
      DifficultyLevel.Easy => 0,
      DifficultyLevel.Moderate => 15,
      DifficultyLevel.Hard => 30,
      DifficultyLevel.Expert => 45,
      _ => 20,
    };

    var distancePenalty = distanceKm * 4;
    var timePenalty = timeMinutes / 6.0;
    return Math.Clamp(100 - difficultyPenalty - distancePenalty - timePenalty, 0, 100);
  }
}
