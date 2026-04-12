using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourPlanner.Controllers;
using TourPlanner.Dtos.TourLogs;
using TourPlanner.Models;

namespace TourPlanner.Tests;

public class TourLogsControllerTests
{
  [Test]
  public async Task Create_persists_log_for_owned_tour()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    db.Tours.Add(new Tour { Id = 10, UserId = 1, Name = "Ride", DistanceKm = 8, EstimatedTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new TourLogsController(db), 1);
    var result = await controller.Create(10, new TourLogRequest { Difficulty = "easy", TotalDistanceKm = 8, TotalTimeMinutes = 30 }, CancellationToken.None);

    Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
    Assert.That(await db.TourLogs.CountAsync(), Is.EqualTo(1));
  }

  [Test]
  public async Task Create_rejects_invalid_difficulty()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    db.Tours.Add(new Tour { Id = 10, UserId = 1, Name = "Ride", DistanceKm = 8, EstimatedTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new TourLogsController(db), 1);
    var result = await controller.Create(10, new TourLogRequest { Difficulty = "impossible", TotalDistanceKm = 8, TotalTimeMinutes = 30 }, CancellationToken.None);

    Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
  }

  [Test]
  public async Task GetAll_returns_logs_for_owned_tour()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    db.Tours.Add(new Tour { Id = 10, UserId = 1, Name = "Ride", DistanceKm = 8, EstimatedTimeMinutes = 30 });
    db.TourLogs.Add(new TourLog { Id = 20, TourId = 10, Comment = "Nice", Difficulty = DifficultyLevel.Easy, TotalDistanceKm = 8, TotalTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new TourLogsController(db), 1);
    var response = await controller.GetAll(10, CancellationToken.None);
    Assert.That(response.Result, Is.TypeOf<OkObjectResult>());
    var payload = (IEnumerable<TourLogResponse>)((OkObjectResult)response.Result!).Value!;

    Assert.That(payload!.Count(), Is.EqualTo(1));
  }

  [Test]
  public async Task GetById_returns_not_found_for_other_users_tour()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.AddRange(
      new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" },
      new AppUser { Id = 2, UserName = "bob", Email = "bob@example.com", PasswordHash = "y" });
    db.Tours.Add(new Tour { Id = 10, UserId = 2, Name = "Bob Ride", DistanceKm = 8, EstimatedTimeMinutes = 30 });
    db.TourLogs.Add(new TourLog { Id = 20, TourId = 10, Comment = "Secret", Difficulty = DifficultyLevel.Easy, TotalDistanceKm = 8, TotalTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new TourLogsController(db), 1);
    var response = await controller.GetById(10, 20, CancellationToken.None);

    Assert.That(response.Result, Is.TypeOf<NotFoundResult>());
  }

  [Test]
  public async Task Delete_removes_log_from_owned_tour()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    db.Tours.Add(new Tour { Id = 10, UserId = 1, Name = "Ride", DistanceKm = 8, EstimatedTimeMinutes = 30 });
    db.TourLogs.Add(new TourLog { Id = 20, TourId = 10, Comment = "Nice", Difficulty = DifficultyLevel.Easy, TotalDistanceKm = 8, TotalTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new TourLogsController(db), 1);
    var result = await controller.Delete(10, 20, CancellationToken.None);

    Assert.That(result, Is.TypeOf<NoContentResult>());
    Assert.That(await db.TourLogs.CountAsync(), Is.EqualTo(0));
  }
}
