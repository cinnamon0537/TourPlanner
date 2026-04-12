using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TourPlanner.Models;

namespace TourPlanner.Services;

public class JwtTokenService : ITokenService
{
  private readonly JwtSettings _settings;

  public JwtTokenService(IOptions<JwtSettings> settings)
  {
    _settings = settings.Value;
  }

  public string CreateToken(AppUser user)
  {
    var claims = new[]
    {
      new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
      new Claim(ClaimTypes.Name, user.UserName),
      new Claim(ClaimTypes.Email, user.Email),
    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
      issuer: _settings.Issuer,
      audience: _settings.Audience,
      claims: claims,
      expires: DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes),
      signingCredentials: creds);

    return new JwtSecurityTokenHandler().WriteToken(token);
  }
}
