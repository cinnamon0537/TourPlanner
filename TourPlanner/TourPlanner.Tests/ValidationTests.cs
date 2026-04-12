using TourPlanner.Dtos.Auth;
using TourPlanner.Dtos.TourLogs;
using TourPlanner.Dtos.Tours;

namespace TourPlanner.Tests;

public class ValidationTests
{
  [Test]
  public void RegisterRequest_is_valid_with_required_fields()
  {
    var results = TestSupport.Validate(new RegisterRequest { UserName = "alice", Email = "alice@example.com", Password = "Secret1!" });
    Assert.That(results, Is.Empty);
  }

  [Test]
  public void RegisterRequest_rejects_short_username()
  {
    var results = TestSupport.Validate(new RegisterRequest { UserName = "ab", Email = "alice@example.com", Password = "Secret1!" });
    Assert.That(results.Select(x => x.ErrorMessage), Has.Some.Contains("UserName"));
  }

  [Test]
  public void RegisterRequest_rejects_invalid_email()
  {
    var results = TestSupport.Validate(new RegisterRequest { UserName = "alice", Email = "not-an-email", Password = "Secret1!" });
    Assert.That(results.Select(x => x.ErrorMessage), Has.Some.Contains("Email"));
  }

  [Test]
  public void RegisterRequest_rejects_short_password()
  {
    var results = TestSupport.Validate(new RegisterRequest { UserName = "alice", Email = "alice@example.com", Password = "12345" });
    Assert.That(results.Select(x => x.ErrorMessage), Has.Some.Contains("Password"));
  }

  [Test]
  public void LoginRequest_is_valid_with_required_fields()
  {
    var results = TestSupport.Validate(new LoginRequest { Identifier = "alice", Password = "Secret1!" });
    Assert.That(results, Is.Empty);
  }

  [Test]
  public void LoginRequest_rejects_missing_identifier()
  {
    var results = TestSupport.Validate(new LoginRequest { Identifier = string.Empty, Password = "Secret1!" });
    Assert.That(results.Select(x => x.ErrorMessage), Has.Some.Contains("Identifier"));
  }

  [Test]
  public void TourRequest_is_valid_with_required_fields()
  {
    var results = TestSupport.Validate(new TourRequest { Name = "Morning Ride", DistanceKm = 12.5, EstimatedTimeMinutes = 45 });
    Assert.That(results, Is.Empty);
  }

  [Test]
  public void TourRequest_rejects_short_name()
  {
    var results = TestSupport.Validate(new TourRequest { Name = "No", DistanceKm = 12.5, EstimatedTimeMinutes = 45 });
    Assert.That(results.Select(x => x.ErrorMessage), Has.Some.Contains("Name"));
  }

  [Test]
  public void TourLogRequest_is_valid_with_required_fields()
  {
    var results = TestSupport.Validate(new TourLogRequest { Difficulty = "easy", TotalDistanceKm = 12.5, TotalTimeMinutes = 45 });
    Assert.That(results, Is.Empty);
  }

  [Test]
  public void TourLogRequest_rejects_missing_difficulty()
  {
    var results = TestSupport.Validate(new TourLogRequest { TotalDistanceKm = 12.5, TotalTimeMinutes = 45 });
    Assert.That(results.Select(x => x.ErrorMessage), Has.Some.Contains("Difficulty"));
  }

  [Test]
  public void TourLogRequest_rejects_zero_rating()
  {
    var results = TestSupport.Validate(new TourLogRequest { Difficulty = "easy", TotalDistanceKm = 12.5, TotalTimeMinutes = 45, Rating = 0 });
    Assert.That(results.Select(x => x.ErrorMessage), Has.Some.Contains("Rating"));
  }
}
