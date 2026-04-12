using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourPlanner.Data;
using TourPlanner.Dtos.Tours;
using TourPlanner.Models;

namespace TourPlanner.Controllers;

[ApiController]
[Authorize]
[Route("api/tours")]
public class ToursController : ControllerBase
{
  private readonly TourPlannerDbContext _db;

  public ToursController(TourPlannerDbContext db)
  {
    _db = db;
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

  private int GetUserId()
    => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new InvalidOperationException("Missing user id claim."));

  private static TourResponse ToResponse(Tour tour)
    => new(tour.Id, tour.UserId, tour.Name, tour.Description, tour.From, tour.To, tour.TransportType, tour.DistanceKm, tour.EstimatedTimeMinutes, tour.CreatedAt);
}
