# Gradebook

A school grade management application for maintaining student records, organizing students by academic year, and recording marks across subjects. The project has an Angular web client, an ASP.NET Core Web API, and a SQL Server database.

## Features

- Create, edit, search, and delete student records.
- Choose from a structured list of kindergarten, primary, preparatory, and secondary years.
- View student profiles and their marks across subjects.
- Create subjects and record, edit, or delete student marks.
- Search for a student while entering marks.
- Review subject grade statistics and results grouped by academic year.
- Use the student records and grade entry screens on desktop, tablet, and mobile layouts.

## Technology

- **Client:** Angular 21, TypeScript, CSS
- **API:** ASP.NET Core 10, C#, Entity Framework Core
- **Database:** Microsoft SQL Server

## Requirements

- .NET 10 SDK
- Node.js and npm
- SQL Server (the current local configuration targets `localhost\SQLEXPRESS`)
- SQL Server Management Studio is useful for inspecting the database, but is not required to run the application.

## Configuration

The development connection string is in `Api/appsettings.Development.json`. Its default value uses Windows Authentication and the local SQL Server Express instance:

```text
Server=localhost\SQLEXPRESS;Database=GradingSystemDb;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True
```

Change `Server` to your SQL Server instance if it differs. For a different authentication setup, update the connection string with the appropriate local credentials and keep secrets out of source control.

The API currently allows browser requests from `http://localhost:4200`. The Angular API client currently sends requests to `http://localhost:5285/api`; if you change the API URL or frontend port, update `Client/src/app/grading-api.ts` and the CORS origin in `Api/Program.cs` to match.

## Run locally

### 1. Create or update the database

Open PowerShell in the `Api` folder and restore the local Entity Framework tool:

```powershell
dotnet tool restore
```

Apply the existing database migrations:

```powershell
dotnet tool run dotnet-ef database update
```

This creates or updates the `GradingSystemDb` database using the configured connection string.

### 2. Start the API

From the `Api` folder:

```powershell
dotnet run --launch-profile http
```

The API listens at `http://localhost:5285`. OpenAPI JSON is available at `http://localhost:5285/openapi/v1.json` while the API runs in the Development environment. The API root (`/`) does not serve a web page; use the Angular client at `http://localhost:4200`.

### 3. Start the Angular client

In a second terminal, from the `Client` folder:

```powershell
npm install
npm start
```

Open `http://localhost:4200` in a browser.

## Build

Build the Angular client from `Client`:

```powershell
npm run build
```

Build the API from `Api`:

```powershell
dotnet build
```

## API overview

| Resource | Routes |
| --- | --- |
| Students | `GET /api/students`, `GET /api/students/{id}`, `POST /api/students`, `PUT /api/students/{id}`, `DELETE /api/students/{id}` |
| Subjects | `GET /api/subjects`, `GET /api/subjects/{id}`, `POST /api/subjects` |
| Student grades | `GET /api/student-grades`, `GET /api/student-grades/{id}`, `POST /api/student-grades`, `PUT /api/student-grades/{id}`, `DELETE /api/student-grades/{id}` |
| Grade statistics | `GET /api/student-grades/statistics?subjectId={id}` |

Student listing accepts optional `searchTerm` and `gradeLetter` query parameters. Grade listing accepts a `subjectId` or `studentId` query parameter.

## Project structure

```text
Api/
  Controllers/       HTTP endpoints for students, subjects, and grades
  Contracts/         Request and response models used by the API
  Data/              Entity Framework database context and data helpers
  Migrations/        SQL Server schema migrations
  Models/            Database entities and grade thresholds
  Program.cs         API services, database, CORS, and routing setup

Client/
  src/app/           Angular pages, routes, academic years, and API client
  src/styles.css     Shared application styles
```

## Data rules

- Each student has a name, a unique national ID, and an academic year.
- Each subject has a unique name.
- A student can have one grade record per subject.
- Each term mark is between 0 and 30; the combined subject total is out of 60.
- Grade letters use the thresholds defined in `Api/Models/GradeScale.cs`.

## Notes

- The API is configured for local development and does not include authentication or authorization.
- Student records and grades are stored in SQL Server; deleting a student also removes their grade records.
