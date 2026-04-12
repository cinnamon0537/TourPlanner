using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TourPlanner.Dtos.Tours;
using TourPlanner.Data;
using TourPlanner.Models;
using TourPlanner.Services;

namespace TourPlanner.Tests;

public static class TestSupport
{
  public static TourPlannerDbContext CreateDbContext(string? name = null)
  {
    var options = new DbContextOptionsBuilder<TourPlannerDbContext>()
      .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString("N"))
      .Options;

    var context = new TourPlannerDbContext(options);
    context.Database.EnsureCreated();
    return context;
  }

  public static ClaimsPrincipal CreateUser(int userId)
    => new(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, userId.ToString())], "test"));

  public static TController WithUser<TController>(TController controller, int userId) where TController : ControllerBase
  {
    controller.ControllerContext = new ControllerContext
    {
      HttpContext = new DefaultHttpContext { User = CreateUser(userId) },
    };

    return controller;
  }

  public static PasswordHasher<AppUser> CreatePasswordHasher() => new();

  public static string HashPassword(AppUser user, string password) => CreatePasswordHasher().HashPassword(user, password);

  public static ITokenService CreateTokenService() => new FakeTokenService();

  public static IRoutePlanningService CreateRoutePlanningService() => new FakeRoutePlanningService();

  public static IReadOnlyList<ValidationResult> Validate(object model)
  {
    var results = new List<ValidationResult>();
    Validator.TryValidateObject(model, new ValidationContext(model), results, true);
    return results;
  }

  private sealed class FakeTokenService : ITokenService
  {
    public string CreateToken(AppUser user) => $"token-{user.Id}-{user.UserName}";
  }

  private sealed class FakeRoutePlanningService : IRoutePlanningService
  {
    public Task<TourPlanResponse> PlanAsync(TourPlanRequest request, CancellationToken cancellationToken)
      => Task.FromResult(new TourPlanResponse(
        request.From,
        request.To,
        request.TransportType,
        12.3,
        45,
        [new TourRoutePointResponse(48.2, 16.3), new TourRoutePointResponse(48.21, 16.31)],
        "test"));
  }
}
