using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourPlanner.Data;
using TourPlanner.Dtos.Auth;
using TourPlanner.Models;
using TourPlanner.Services;

namespace TourPlanner.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
  private readonly TourPlannerDbContext _db;
  private readonly IPasswordHasher<AppUser> _passwordHasher;
  private readonly ITokenService _tokenService;

  public AuthController(TourPlannerDbContext db, IPasswordHasher<AppUser> passwordHasher, ITokenService tokenService)
  {
    _db = db;
    _passwordHasher = passwordHasher;
    _tokenService = tokenService;
  }

  [HttpPost("register")]
  public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
  {
    if (await _db.Users.AnyAsync(x => x.Email == request.Email || x.UserName == request.UserName, cancellationToken))
    {
      return Conflict("User already exists.");
    }

    var user = new AppUser
    {
      UserName = request.UserName,
      Email = request.Email,
    };

    user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

    _db.Users.Add(user);
    await _db.SaveChangesAsync(cancellationToken);

    return Ok(new AuthResponse(_tokenService.CreateToken(user), user.Id, user.UserName, user.Email));
  }

  [HttpPost("login")]
  public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
  {
    var user = await _db.Users.FirstOrDefaultAsync(
      x => x.Email == request.Identifier || x.UserName == request.Identifier,
      cancellationToken);

    if (user == null)
    {
      return Unauthorized();
    }

    var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
    if (result == PasswordVerificationResult.Failed)
    {
      return Unauthorized();
    }

    return Ok(new AuthResponse(_tokenService.CreateToken(user), user.Id, user.UserName, user.Email));
  }
}
