using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourPlanner.Controllers;
using TourPlanner.Dtos.Tours;
using TourPlanner.Models;

namespace TourPlanner.Tests;

public class ToursControllerTests
{
  [Test]
  public async Task Create_persists_tour_for_current_user()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new ToursController(db, TestSupport.CreateRoutePlanningService(), TestSupport.CreateTourImageStorageService()), 1);
    var result = await controller.Create(new TourRequest { Name = "Morning Ride", DistanceKm = 12, EstimatedTimeMinutes = 45 }, CancellationToken.None);

    Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
    Assert.That(await db.Tours.CountAsync(), Is.EqualTo(1));
  }

  [Test]
  public async Task GetAll_returns_only_current_users_tours()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.AddRange(
      new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" },
      new AppUser { Id = 2, UserName = "bob", Email = "bob@example.com", PasswordHash = "y" });
    db.Tours.AddRange(
      new Tour { UserId = 1, Name = "Alice Tour", DistanceKm = 5, EstimatedTimeMinutes = 20 },
      new Tour { UserId = 2, Name = "Bob Tour", DistanceKm = 8, EstimatedTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new ToursController(db, TestSupport.CreateRoutePlanningService(), TestSupport.CreateTourImageStorageService()), 1);
    var response = await controller.GetAll(CancellationToken.None);
    Assert.That(response.Result, Is.TypeOf<OkObjectResult>());
    var payload = (IEnumerable<TourResponse>)((OkObjectResult)response.Result!).Value!;

    Assert.That(payload!.Count(), Is.EqualTo(1));
    Assert.That(payload.Single().Name, Is.EqualTo("Alice Tour"));
  }

  [Test]
  public async Task GetById_returns_not_found_for_other_user_tour()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.AddRange(
      new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" },
      new AppUser { Id = 2, UserName = "bob", Email = "bob@example.com", PasswordHash = "y" });
    db.Tours.Add(new Tour { Id = 10, UserId = 2, Name = "Bob Tour", DistanceKm = 8, EstimatedTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new ToursController(db, TestSupport.CreateRoutePlanningService(), TestSupport.CreateTourImageStorageService()), 1);
    var response = await controller.GetById(10, CancellationToken.None);

    Assert.That(response.Result, Is.TypeOf<NotFoundResult>());
  }

  [Test]
  public async Task Update_changes_existing_tour()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    db.Tours.Add(new Tour { Id = 10, UserId = 1, Name = "Old", DistanceKm = 8, EstimatedTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new ToursController(db, TestSupport.CreateRoutePlanningService(), TestSupport.CreateTourImageStorageService()), 1);
    var result = await controller.Update(10, new TourRequest { Name = "New", DistanceKm = 15, EstimatedTimeMinutes = 60 }, CancellationToken.None);

    Assert.That(result, Is.TypeOf<NoContentResult>());
    Assert.That((await db.Tours.FindAsync(10))!.Name, Is.EqualTo("New"));
  }

  [Test]
  public async Task Delete_removes_existing_tour()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    db.Tours.Add(new Tour { Id = 10, UserId = 1, Name = "To delete", DistanceKm = 8, EstimatedTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new ToursController(db, TestSupport.CreateRoutePlanningService(), TestSupport.CreateTourImageStorageService()), 1);
    var result = await controller.Delete(10, CancellationToken.None);

    Assert.That(result, Is.TypeOf<NoContentResult>());
    Assert.That(await db.Tours.CountAsync(), Is.EqualTo(0));
  }

  [Test]
  public async Task Search_matches_tour_name_and_log_comment()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    var tour = new Tour { Id = 10, UserId = 1, Name = "Forest Ride", Description = "Scenic route", DistanceKm = 8, EstimatedTimeMinutes = 30 };
    db.Tours.Add(tour);
    db.TourLogs.Add(new TourLog { TourId = 10, Comment = "Forest was lovely", Difficulty = DifficultyLevel.Easy, TotalDistanceKm = 8, TotalTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new ToursController(db, TestSupport.CreateRoutePlanningService(), TestSupport.CreateTourImageStorageService()), 1);
    var response = await controller.Search("forest", CancellationToken.None);
    Assert.That(response.Result, Is.TypeOf<OkObjectResult>());
    var payload = (IEnumerable<TourSearchResponse>)((OkObjectResult)response.Result!).Value!;

    Assert.That(payload!.Count(), Is.EqualTo(1));
    Assert.That(payload.Single().MatchSummary, Does.Contain("name").Or.Contain("log comment"));
  }

  [Test]
  public async Task Search_includes_popularity_and_child_friendliness()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    db.Tours.Add(new Tour { Id = 10, UserId = 1, Name = "Forest Ride", DistanceKm = 8, EstimatedTimeMinutes = 30 });
    db.TourLogs.AddRange(
      new TourLog { TourId = 10, Comment = "Nice", Difficulty = DifficultyLevel.Easy, TotalDistanceKm = 8, TotalTimeMinutes = 30 },
      new TourLog { TourId = 10, Comment = "Nice again", Difficulty = DifficultyLevel.Moderate, TotalDistanceKm = 8, TotalTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new ToursController(db, TestSupport.CreateRoutePlanningService(), TestSupport.CreateTourImageStorageService()), 1);
    var response = await controller.Search(null, CancellationToken.None);
    Assert.That(response.Result, Is.TypeOf<OkObjectResult>());
    var payload = (IEnumerable<TourSearchResponse>)((OkObjectResult)response.Result!).Value!;

    var item = payload!.Single();
    Assert.That(item.Popularity, Is.EqualTo(2));
    Assert.That(item.ChildFriendlinessScore, Is.InRange(0, 100));
  }

  [Test]
  public async Task Plan_returns_route_geometry()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new ToursController(db, TestSupport.CreateRoutePlanningService(), TestSupport.CreateTourImageStorageService()), 1);
    var response = await controller.Plan(new TourPlanRequest { From = "Vienna", To = "Graz", TransportType = "walking" }, CancellationToken.None);

    Assert.That(response.Result, Is.TypeOf<OkObjectResult>());
  }

  [Test]
  public async Task Export_returns_owned_tours_with_logs()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    db.Tours.Add(new Tour { Id = 10, UserId = 1, Name = "Export me", DistanceKm = 8, EstimatedTimeMinutes = 30 });
    db.TourLogs.Add(new TourLog { TourId = 10, Comment = "Nice", Difficulty = DifficultyLevel.Easy, TotalDistanceKm = 8, TotalTimeMinutes = 30 });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new ToursController(db, TestSupport.CreateRoutePlanningService(), TestSupport.CreateTourImageStorageService()), 1);
    var response = await controller.Export(CancellationToken.None);

    Assert.That(response.Result, Is.TypeOf<OkObjectResult>());
  }

  [Test]
  public async Task Import_creates_tours_from_payload()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new ToursController(db, TestSupport.CreateRoutePlanningService(), TestSupport.CreateTourImageStorageService()), 1);
    var response = await controller.Import(new TourImportRequest
    {
      Tours = [new TourImportItem
      {
        Name = "Imported",
        Description = "From test",
        From = "A",
        To = "B",
        TransportType = "walking",
        DistanceKm = 9,
        EstimatedTimeMinutes = 20,
      }]
    }, CancellationToken.None);

    Assert.That(response.Result, Is.TypeOf<OkObjectResult>());
    Assert.That(await db.Tours.CountAsync(), Is.EqualTo(1));
  }

  [Test]
  public async Task UploadImage_returns_relative_path()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { Id = 1, UserName = "alice", Email = "alice@example.com", PasswordHash = "x" });
    await db.SaveChangesAsync();

    var controller = TestSupport.WithUser(new ToursController(db, TestSupport.CreateRoutePlanningService(), TestSupport.CreateTourImageStorageService()), 1);
    await using var stream = new MemoryStream([1, 2, 3]);
    var file = new FormFile(stream, 0, stream.Length, "file", "photo.png");

    var response = await controller.UploadImage(file, CancellationToken.None);

    Assert.That(response.Result, Is.TypeOf<OkObjectResult>());
  }
}
