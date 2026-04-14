using Microsoft.AspNetCore.Hosting;
using TourPlanner.Services;

namespace TourPlanner.Infrastructure;

public class FileSystemTourImageStorageService : ITourImageStorageService
{
  private readonly IWebHostEnvironment _environment;

  public FileSystemTourImageStorageService(IWebHostEnvironment environment)
  {
    _environment = environment;
  }

  public async Task<string> SaveAsync(Stream fileStream, string fileName, CancellationToken cancellationToken)
  {
    var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
    var uploadsRoot = Path.Combine(webRoot, "uploads", "tour-images");
    Directory.CreateDirectory(uploadsRoot);

    var extension = Path.GetExtension(fileName);
    if (string.IsNullOrWhiteSpace(extension))
    {
      extension = ".bin";
    }

    var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
    var fullPath = Path.Combine(uploadsRoot, storedFileName);

    await using var stream = File.Create(fullPath);
    await fileStream.CopyToAsync(stream, cancellationToken);

    return $"/uploads/tour-images/{storedFileName}";
  }
}
