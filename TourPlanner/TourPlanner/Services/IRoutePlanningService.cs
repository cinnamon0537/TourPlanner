using TourPlanner.Dtos.Tours;

namespace TourPlanner.Services;

public interface IRoutePlanningService
{
  Task<TourPlanResponse> PlanAsync(TourPlanRequest request, CancellationToken cancellationToken);
}
