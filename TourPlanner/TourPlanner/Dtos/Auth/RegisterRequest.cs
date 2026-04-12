using System.ComponentModel.DataAnnotations;

namespace TourPlanner.Dtos.Auth;

public record RegisterRequest(
  [property: Required, MinLength(3)] string UserName,
  [property: Required, EmailAddress] string Email,
  [property: Required, MinLength(6)] string Password);
