using TourPlanner.Models;

namespace TourPlanner.Services;

public interface ITokenService
{
  string CreateToken(AppUser user);
}
