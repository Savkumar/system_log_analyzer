# SQLite-Based Report Sharing Implementation

This document outlines the changes made to implement SQLite storage for report sharing in the Server Performance Analysis application.

## Overview

The application now uses SQLite to store and retrieve shared reports, allowing persistent storage of analysis states that can be shared via URLs and accessed across server restarts.

## Key Components Added

1. **Schema Definition** (`shared/schema.ts`)
   - Added `reports` table schema to store report data
   - Implemented types for report data structures

2. **SQLite Storage Layer** (`server/storage.ts`)
   - Created `SQLiteStorage` class for database operations
   - Implemented CRUD methods for reports (create, retrieve, delete)
   - Added configurable database path support

3. **API Endpoints** (`server/routes.ts`)
   - Added `/api/reports` POST endpoint to save a report
   - Added `/api/reports/:shareId` GET endpoint to retrieve a shared report
   - Added `/api/reports/:shareId` DELETE endpoint to remove a report

4. **Client Implementation** (`client/src/components/ServerPerformanceAnalysis.tsx`)
   - Updated share functionality to save report data to the database
   - Enhanced report loading to fetch data from the database

## Configuration

The SQLite database location can be configured in three ways (in order of precedence):

1. Passing a path to the SQLiteStorage constructor
2. Setting the `SQLITE_DB_PATH` environment variable
3. Using the default path: `{process.cwd()}/data/reports.db`

## Required NPM Packages

The following packages were added to `package.json`:
- `sqlite`: ^5.1.1
- `sqlite3`: ^5.1.7

## How to Configure in Production

To set up the SQLite database in your production environment:

1. Install the required packages:
   ```
   npm install
   ```

2. Configure the database path using an environment variable:
   ```
   export SQLITE_DB_PATH=/path/to/your/production/db/reports.db
   ```

3. On server startup, the application will automatically:
   - Create the necessary directory structure
   - Initialize the database
   - Create required tables if they don't exist

## How the Share Feature Works

1. When a user clicks "Share":
   - A unique ID is generated
   - The current analysis state is serialized
   - The data is stored in the SQLite database
   - A URL with the unique ID is generated

2. When a shared URL is accessed:
   - The application extracts the share ID from the URL
   - It fetches the saved report data from the database
   - The analysis state is restored to display the shared view

## Troubleshooting

If you encounter issues with the SQLite implementation:

1. Check database permissions - ensure the application has read/write access to the database file and its containing directory
2. Verify the path exists and is accessible
3. Check server logs for SQLite-related error messages
4. Test the database connection using a tool like SQLite Browser

## Future Improvements

Potential enhancements to consider:

1. Adding authentication to protect shared reports
2. Implementing expiration dates for shared links
3. Adding the ability to update existing reports
4. Implementing user management for report ownership
