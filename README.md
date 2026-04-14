# TourPlanner

## Quick start
1. Start PostgreSQL and make sure the default `TourPlanner` database is available.
2. Start the backend:
   ```bash
   dotnet watch run
   ```
3. In a second terminal, start the Angular app:
   ```bash
   cd angular20
   npm install
   npm start
   ```

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
