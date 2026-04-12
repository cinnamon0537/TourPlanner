using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourPlanner.Controllers;
using TourPlanner.Data;
using TourPlanner.Dtos.Auth;
using TourPlanner.Models;

namespace TourPlanner.Tests;

public class AuthControllerTests
{
  [Test]
  public async Task Register_creates_user_and_returns_token()
  {
    await using var db = TestSupport.CreateDbContext();
    var controller = new AuthController(db, TestSupport.CreatePasswordHasher(), TestSupport.CreateTokenService());

    var response = await controller.Register(new RegisterRequest { UserName = "alice", Email = "alice@example.com", Password = "Secret1!" }, CancellationToken.None);

    Assert.That(response.Result, Is.TypeOf<OkObjectResult>());
    Assert.That(await db.Users.CountAsync(), Is.EqualTo(1));
  }

  [Test]
  public async Task Register_returns_conflict_when_user_exists()
  {
    await using var db = TestSupport.CreateDbContext();
    db.Users.Add(new AppUser { UserName = "alice", Email = "alice@example.com", PasswordHash = TestSupport.HashPassword(new AppUser(), "Secret1!") });
    await db.SaveChangesAsync();

    var controller = new AuthController(db, TestSupport.CreatePasswordHasher(), TestSupport.CreateTokenService());
    var response = await controller.Register(new RegisterRequest { UserName = "alice", Email = "alice2@example.com", Password = "Secret1!" }, CancellationToken.None);

    Assert.That(response.Result, Is.TypeOf<ConflictObjectResult>());
  }

  [Test]
  public async Task Login_succeeds_with_username()
  {
    await using var db = TestSupport.CreateDbContext();
    var user = new AppUser { UserName = "alice", Email = "alice@example.com" };
    user.PasswordHash = TestSupport.HashPassword(user, "Secret1!");
    db.Users.Add(user);
    await db.SaveChangesAsync();

    var controller = new AuthController(db, TestSupport.CreatePasswordHasher(), TestSupport.CreateTokenService());
    var response = await controller.Login(new LoginRequest { Identifier = "alice", Password = "Secret1!" }, CancellationToken.None);

    Assert.That(response.Result, Is.TypeOf<OkObjectResult>());
  }

  [Test]
  public async Task Login_succeeds_with_email()
  {
    await using var db = TestSupport.CreateDbContext();
    var user = new AppUser { UserName = "alice", Email = "alice@example.com" };
    user.PasswordHash = TestSupport.HashPassword(user, "Secret1!");
    db.Users.Add(user);
    await db.SaveChangesAsync();

    var controller = new AuthController(db, TestSupport.CreatePasswordHasher(), TestSupport.CreateTokenService());
    var response = await controller.Login(new LoginRequest { Identifier = "alice@example.com", Password = "Secret1!" }, CancellationToken.None);

    Assert.That(response.Result, Is.TypeOf<OkObjectResult>());
  }

  [Test]
  public async Task Login_rejects_wrong_password()
  {
    await using var db = TestSupport.CreateDbContext();
    var user = new AppUser { UserName = "alice", Email = "alice@example.com" };
    user.PasswordHash = TestSupport.HashPassword(user, "Secret1!");
    db.Users.Add(user);
    await db.SaveChangesAsync();

    var controller = new AuthController(db, TestSupport.CreatePasswordHasher(), TestSupport.CreateTokenService());
    var response = await controller.Login(new LoginRequest { Identifier = "alice", Password = "wrong" }, CancellationToken.None);

    Assert.That(response.Result, Is.TypeOf<UnauthorizedResult>());
  }
}
