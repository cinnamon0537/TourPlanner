using Microsoft.AspNetCore.Mvc;

namespace TourPlanner.Controllers;

[ApiController]
[Route("[controller]/[action]")]
public class ValuesController : ControllerBase
{
  public record struct OkStatus(bool IsOk, string Val, string? Error = null);

  [HttpGet]
  public OkStatus Dummy()
  {
    this.Log();
    return new OkStatus(true, $"{DateTime.Now:HH:mm:ss}");
  }
}
