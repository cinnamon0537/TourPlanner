namespace TourPlanner.Services;

public interface ITourImageStorageService
{
  Task<string> SaveAsync(Stream fileStream, string fileName, CancellationToken cancellationToken);
}
