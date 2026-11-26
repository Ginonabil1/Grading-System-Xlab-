# Gradebook

A school grading app with an Angular frontend and an ASP.NET Core API backed by SQL Server.

## Run the app

Start the API from the `Api` folder:

```powershell
dotnet run --launch-profile http
```

Start the frontend from the `Client` folder:

```powershell
npm install
npm start
```

Open `http://localhost:4200`. The frontend sends requests to the API at `http://localhost:5285/api`.

## Project map

- `Api/Controllers` contains the student, subject, and grade endpoints.
- `Api/Models` contains the database models and grade thresholds.
- `Api/Data/GradingDbContext.cs` defines the database tables and relationships.
- `Client/src/app` contains the pages, API client, and academic-year options.
- `Client/src/styles.css` contains shared styles.

Build the frontend with `npm run build` from `Client`. Build the API with `dotnet build` from `Api`.
