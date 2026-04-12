using GrueneisR.RestClientGenerator;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using TourPlanner.Models;
using TourPlanner.Infrastructure;

string corsKey = "_myAllowSpecificOrigins";
string swaggerVersion = "v1";
string swaggerTitle = "TourPlanner";
string restClientFolder = Environment.CurrentDirectory;
string restClientFilename = "_requests.http";

var builder = WebApplication.CreateBuilder(args);
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();

builder.Services.AddControllers().AddJsonOptions(options =>
{
  options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddAuthorization();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options =>
  {
    options.TokenValidationParameters = new TokenValidationParameters
    {
      ValidateIssuer = true,
      ValidateAudience = true,
      ValidateLifetime = true,
      ValidateIssuerSigningKey = true,
      ValidIssuer = jwtSettings.Issuer,
      ValidAudience = jwtSettings.Audience,
      IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
      ClockSkew = TimeSpan.Zero,
    };
  });
builder.Services.AddSwaggerGen(x => x.SwaggerDoc(
  swaggerVersion,
  new OpenApiInfo { Title = swaggerTitle, Version = swaggerVersion }
));
builder.Services.AddCors(options => options.AddPolicy(
  corsKey,
  x => x.SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials()
));
builder.Services.AddTourPlannerInfrastructure(builder.Configuration);
builder.Services.AddRestClientGenerator(options => options
  .SetFolder(restClientFolder)
  .SetFilename(restClientFilename)
  .SetAction($"swagger/{swaggerVersion}/swagger.json")
);

builder.Services.AddLogging(x => x.AddCustomFormatter());

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
  app.UseDeveloperExceptionPage();
  Console.ForegroundColor = ConsoleColor.Green;
  Console.WriteLine($"++++ Swagger enabled: http://localhost:5000");
  app.UseSwagger();
  Console.WriteLine($"++++ RestClient generating (after first request) to {restClientFolder}\\{restClientFilename}");
  app.UseRestClientGenerator();
  app.UseSwaggerUI(x => x.SwaggerEndpoint($"/swagger/{swaggerVersion}/swagger.json", swaggerTitle));
  Console.ResetColor();
}

app.UseCors(corsKey);
app.UseAuthentication();
app.UseAuthorization();
app.Map("/", () => Results.Redirect("/swagger"));
app.MapControllers();
await app.InitializeTourPlannerDatabaseAsync();
Console.WriteLine($"Ready for clients at {DateTime.Now:HH:mm:ss} ...");
app.Run();
