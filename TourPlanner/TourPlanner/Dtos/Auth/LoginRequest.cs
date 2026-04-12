using System.ComponentModel.DataAnnotations;

namespace TourPlanner.Dtos.Auth;

public record LoginRequest(
  [property: Required] string Identifier,
  [property: Required] string Password);
