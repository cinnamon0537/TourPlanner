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
  public DbSet<TourLog> TourLogs => Set<TourLog>();

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
      entity.Property(x => x.Image).HasMaxLength(2000);
      entity.Property(x => x.From).HasMaxLength(200);
      entity.Property(x => x.To).HasMaxLength(200);
      entity.Property(x => x.TransportType).HasMaxLength(100);
      entity.HasOne(x => x.User)
        .WithMany(x => x.Tours)
        .HasForeignKey(x => x.UserId)
        .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<TourLog>(entity =>
    {
      entity.ToTable("TourLogs");
      entity.HasKey(x => x.Id);
      entity.Property(x => x.Comment).HasMaxLength(2000);
      entity.Property(x => x.Difficulty).HasConversion<string>().HasMaxLength(20);
      entity.HasOne(x => x.Tour)
        .WithMany(x => x.TourLogs)
        .HasForeignKey(x => x.TourId)
        .OnDelete(DeleteBehavior.Cascade);
    });
  }
}
