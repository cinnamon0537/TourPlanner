using log4net;
using log4net.Config;
using log4net.Repository;
using Microsoft.Extensions.Logging;
using System.Reflection;

namespace TourPlanner.Logging;

public static class Log4NetLoggingExtensions
{
  public static ILoggingBuilder AddTourPlannerLog4Net(this ILoggingBuilder builder)
  {
    var repository = LogManager.GetRepository(Assembly.GetEntryAssembly() ?? Assembly.GetExecutingAssembly());
    var configPath = Path.Combine(AppContext.BaseDirectory, "log4net.config");
    XmlConfigurator.Configure(repository, new FileInfo(configPath));
    builder.AddProvider(new Log4NetLoggerProvider(repository));
    return builder;
  }
}

internal sealed class Log4NetLoggerProvider : ILoggerProvider
{
  private readonly ILoggerRepository _repository;

  public Log4NetLoggerProvider(ILoggerRepository repository) => _repository = repository;

  public ILogger CreateLogger(string categoryName) => new Log4NetLogger(_repository, categoryName);

  public void Dispose() { }
}

internal sealed class Log4NetLogger : ILogger
{
  private readonly ILog _logger;

  public Log4NetLogger(ILoggerRepository repository, string categoryName)
    => _logger = LogManager.GetLogger(repository.Name, categoryName);

  public IDisposable BeginScope<TState>(TState state) where TState : notnull => NullScope.Instance;

  public bool IsEnabled(LogLevel logLevel) => logLevel != LogLevel.None;

  public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
  {
    if (!IsEnabled(logLevel)) return;

    var message = formatter(state, exception);
    if (string.IsNullOrWhiteSpace(message) && exception is null) return;

    switch (logLevel)
    {
      case LogLevel.Trace:
      case LogLevel.Debug:
        _logger.Debug(message, exception);
        break;
      case LogLevel.Information:
        _logger.Info(message, exception);
        break;
      case LogLevel.Warning:
        _logger.Warn(message, exception);
        break;
      case LogLevel.Error:
      case LogLevel.Critical:
        _logger.Error(message, exception);
        break;
      default:
        _logger.Info(message, exception);
        break;
    }
  }

  private sealed class NullScope : IDisposable
  {
    public static readonly NullScope Instance = new();
    public void Dispose() { }
  }
}
