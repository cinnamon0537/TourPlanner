using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourPlanner.Data;
using TourPlanner.Dtos.TourLogs;
using TourPlanner.Models;

namespace TourPlanner.Controllers;

[ApiController]
[Authorize]
[Route("api/tours/{tourId:int}/logs")]
public class TourLogsController : ControllerBase
{
  private readonly TourPlannerDbContext _db;

  public TourLogsController(TourPlannerDbContext db)
  {
    _db = db;
  }

  [HttpGet]
  public async Task<ActionResult<IEnumerable<TourLogResponse>>> GetAll(int tourId, CancellationToken cancellationToken)
  {
    if (!await OwnsTour(tourId, cancellationToken))
    {
      return NotFound();
    }

    var logs = await _db.TourLogs
      .Where(x => x.TourId == tourId)
      .OrderByDescending(x => x.LogDateTime)
      .Select(x => ToResponse(x))
      .ToListAsync(cancellationToken);

    return Ok(logs);
  }

  [HttpGet("{id:int}")]
  public async Task<ActionResult<TourLogResponse>> GetById(int tourId, int id, CancellationToken cancellationToken)
  {
    if (!await OwnsTour(tourId, cancellationToken))
    {
      return NotFound();
    }

    var log = await GetLogAsync(tourId, id, cancellationToken);
    return log == null ? NotFound() : Ok(ToResponse(log));
  }

  [HttpPost]
  public async Task<ActionResult<TourLogResponse>> Create(int tourId, TourLogRequest request, CancellationToken cancellationToken)
  {
    if (!await OwnsTour(tourId, cancellationToken))
    {
      return NotFound();
    }

    if (!Enum.TryParse<DifficultyLevel>(request.Difficulty, true, out var difficulty))
    {
      return BadRequest("Invalid difficulty.");
    }

    var log = new TourLog
    {
      TourId = tourId,
      LogDateTime = request.LogDateTime,
      Comment = request.Comment,
      Difficulty = difficulty,
      TotalDistanceKm = request.TotalDistanceKm,
      TotalTimeMinutes = request.TotalTimeMinutes,
      Rating = request.Rating,
    };

    _db.TourLogs.Add(log);
    await _db.SaveChangesAsync(cancellationToken);

    return CreatedAtAction(nameof(GetById), new { tourId, id = log.Id }, ToResponse(log));
  }

  [HttpPut("{id:int}")]
  public async Task<IActionResult> Update(int tourId, int id, TourLogRequest request, CancellationToken cancellationToken)
  {
    if (!await OwnsTour(tourId, cancellationToken))
    {
      return NotFound();
    }

    var log = await GetLogAsync(tourId, id, cancellationToken);
    if (log == null)
    {
      return NotFound();
    }

    if (!Enum.TryParse<DifficultyLevel>(request.Difficulty, true, out var difficulty))
    {
      return BadRequest("Invalid difficulty.");
    }

    log.LogDateTime = request.LogDateTime;
    log.Comment = request.Comment;
    log.Difficulty = difficulty;
    log.TotalDistanceKm = request.TotalDistanceKm;
    log.TotalTimeMinutes = request.TotalTimeMinutes;
    log.Rating = request.Rating;

    await _db.SaveChangesAsync(cancellationToken);
    return NoContent();
  }

  [HttpDelete("{id:int}")]
  public async Task<IActionResult> Delete(int tourId, int id, CancellationToken cancellationToken)
  {
    if (!await OwnsTour(tourId, cancellationToken))
    {
      return NotFound();
    }

    var log = await GetLogAsync(tourId, id, cancellationToken);
    if (log == null)
    {
      return NotFound();
    }

    _db.TourLogs.Remove(log);
    await _db.SaveChangesAsync(cancellationToken);
    return NoContent();
  }

  private async Task<bool> OwnsTour(int tourId, CancellationToken cancellationToken)
    => await _db.Tours.AnyAsync(x => x.Id == tourId && x.UserId == GetUserId(), cancellationToken);

  private async Task<TourLog?> GetLogAsync(int tourId, int id, CancellationToken cancellationToken)
    => await _db.TourLogs.FirstOrDefaultAsync(x => x.TourId == tourId && x.Id == id, cancellationToken);

  private int GetUserId()
    => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? throw new InvalidOperationException("Missing user id claim."));

  private static TourLogResponse ToResponse(TourLog log)
    => new(log.Id, log.TourId, log.LogDateTime, log.Comment, log.Difficulty.ToString().ToLowerInvariant(), log.TotalDistanceKm, log.TotalTimeMinutes, log.Rating, log.CreatedAt);
}
