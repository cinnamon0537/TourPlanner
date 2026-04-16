using Microsoft.Extensions.Options;
using System.IdentityModel.Tokens.Jwt;
using TourPlanner.Models;
using TourPlanner.Services;

namespace TourPlanner.Tests;

public class JwtTokenServiceTests
{
  [Test]
  public void CreateToken_embeds_expected_claims()
  {
    var service = new JwtTokenService(Options.Create(new JwtSettings
    {
      Issuer = "issuer",
      Audience = "audience",
      Key = new string('a', 32),
      ExpiryMinutes = 60,
    }));

    var token = service.CreateToken(new AppUser { Id = 7, UserName = "alice", Email = "alice@example.com" });
    var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

    Assert.That(jwt.Issuer, Is.EqualTo("issuer"));
    Assert.That(jwt.Audiences, Has.Some.EqualTo("audience"));
    Assert.That(jwt.Claims.Single(x => x.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value, Is.EqualTo("7"));
    Assert.That(jwt.Claims.Single(x => x.Type == System.Security.Claims.ClaimTypes.Name).Value, Is.EqualTo("alice"));
  }

  [Test]
  public void CreateToken_creates_different_subject_for_different_users()
  {
    var service = new JwtTokenService(Options.Create(new JwtSettings
    {
      Key = new string('b', 32),
    }));

    var tokenOne = service.CreateToken(new AppUser { Id = 1, UserName = "one", Email = "one@example.com" });
    var tokenTwo = service.CreateToken(new AppUser { Id = 2, UserName = "two", Email = "two@example.com" });

    Assert.That(tokenOne, Is.Not.EqualTo(tokenTwo));
  }
}
