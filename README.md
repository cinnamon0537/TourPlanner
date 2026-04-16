# TourPlanner

## Repository
- GitHub: https://github.com/cinnamon0537/TourPlanner

## Quick start
1. Start PostgreSQL.
2. Create a local database user and database for the app. This example uses the same names the project expects:
   ```bash
   psql -h 127.0.0.1 -U postgres -c "CREATE USER tourplanner WITH PASSWORD 'choose-a-local-password';"
   psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE tourplanner OWNER tourplanner;"
   ```
   If you already have a PostgreSQL user and database, keep using them, but make sure the connection string below matches.
3. From `app/TourPlanner/TourPlanner`, write the local secrets into the .NET secret store:
   ```bash
   dotnet user-secrets set "ConnectionStrings:TourPlanner" "Host=127.0.0.1;Port=5432;Database=tourplanner;Username=tourplanner;Password=choose-a-local-password"
   dotnet user-secrets set "Jwt:Key" "put-a-random-32+-character-secret-here"
   dotnet user-secrets set "OpenRouteService:ApiKey" "your-openrouteservice-api-key"
   ```
   If you use a different PostgreSQL user, database, or host, change the connection string accordingly.
4. Verify the secrets are present:
   ```bash
   dotnet user-secrets list
   ```
5. Start the backend from `app/TourPlanner/TourPlanner`:
   ```bash
   dotnet watch run
   ```
6. In a second terminal, start the Angular app from `app/angular20`:
   ```bash
   cd angular20
   npm install
   npm start
   ```

## If the backend does not start
- Check that PostgreSQL is running on the host from the connection string.
- Check that the `tourplanner` database exists and that the user has access.
- Check that `dotnet user-secrets list` shows `ConnectionStrings:TourPlanner`, `Jwt:Key`, and `OpenRouteService:ApiKey`.
- Check that the OpenRouteService key is valid if route planning should work.

## What to expect
- Backend Swagger is available on `http://localhost:5000`.
- The Angular dashboard is the main UI for login, tours, logs, planning, import/export, and image upload.
- The backend creates and updates the local schema on startup.

## Notes for collaborators
- The app uses the seeded local API session flow and JWT auth from the backend.
- Logs belong to a selected tour, so select a tour before creating or editing logs.
- The upload endpoint stores tour images under `wwwroot/uploads/tour-images`.

## Useful commands
```bash
dotnet build
dotnet test
cd angular20 && npm run build
```
