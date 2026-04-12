using Microsoft.EntityFrameworkCore;
using TourPlanner.Models;

namespace TourPlanner.Data;

public class TourPlannerDbContext : DbContext
{
  public TourPlannerDbContext(DbContextOptions<TourPlannerDbContext> options) : base(options)
  {
  }

  public DbSet<AppUser> Users => Set<AppUser>();
  public DbSet<Tour> Tours => Set<Tour>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<AppUser>(entity =>
    {
      entity.ToTable("Users");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.UserName).IsRequired().HasMaxLength(100);
      entity.Property(x => x.Email).IsRequired().HasMaxLength(200);
      entity.Property(x => x.PasswordHash).IsRequired().HasMaxLength(500);
      entity.HasIndex(x => x.UserName).IsUnique();
      entity.HasIndex(x => x.Email).IsUnique();
    });

    modelBuilder.Entity<Tour>(entity =>
    {
      entity.ToTable("Tours");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Name).IsRequired().HasMaxLength(200);
      entity.Property(x => x.Description).HasMaxLength(1000);
      entity.Property(x => x.From).HasMaxLength(200);
      entity.Property(x => x.To).HasMaxLength(200);
      entity.Property(x => x.TransportType).HasMaxLength(100);
      entity.HasOne(x => x.User)
        .WithMany(x => x.Tours)
        .HasForeignKey(x => x.UserId)
        .OnDelete(DeleteBehavior.Cascade);
    });
  }
}
