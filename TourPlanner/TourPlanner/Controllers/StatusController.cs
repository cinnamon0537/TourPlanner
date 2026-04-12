using Microsoft.AspNetCore.Mvc;
using TourPlanner.Models;

namespace TourPlanner.Controllers;

[ApiController]
public class StatusController : ControllerBase
{
  [ProducesResponseType(typeof(StatusResponse), StatusCodes.Status200OK)]
  [HttpGet("/health")]
  public ActionResult<StatusResponse> Health() => Ok(new StatusResponse { Status = "ok" });

  [ProducesResponseType(typeof(StatusResponse), StatusCodes.Status200OK)]
  [HttpGet("/test")]
  public ActionResult<StatusResponse> Test() => Ok(new StatusResponse { Status = "TourPlanner backend ready" });
}
