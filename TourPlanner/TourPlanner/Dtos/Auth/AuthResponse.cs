namespace TourPlanner.Dtos.Auth;

public record AuthResponse(string Token, int UserId, string UserName, string Email);
