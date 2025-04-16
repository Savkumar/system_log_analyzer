# SQLite Implementation for Report Sharing

## Overview

We've implemented SQLite storage for the report sharing functionality in the Server Performance Analysis tool. This implementation provides persistent storage for analysis reports, allowing users to share their analyses via URLs and access them across server restarts.

## Implementation Components

### 1. Schema Definition
Located in `shared/schema.ts`, we've added:
- A `reports` table schema to store report data
- Type definitions for report data structures
- Schema validation using zod and drizzle

### 2. Storage Layer
Located in `server/storage.ts`, we've created:
- A `SQLiteStorage` class implementing the `IStorage` interface
- CRUD operations for reports (create, retrieve, delete)
- Proper error handling and JSON serialization/deserialization
- Database initialization and table creation

### 3. API Endpoints
Located in `server/routes.ts`, we've added:
- POST `/api/reports` - Create a new report
- GET `/api/reports/:shareId` - Retrieve a shared report
- DELETE `/api/reports/:shareId` - Delete a report

### 4. Client Integration
Located in `client/src/components/ServerPerformanceAnalysis.tsx`, we've updated:
- The share button functionality to save report data to SQLite
- The URL parameter handling to load shared reports

### 5. Type Definitions
Located in `server/types.d.ts`, we've added:
- Type declarations for better-sqlite3 to ensure TypeScript compatibility

## Configuration

The SQLite database location can be configured in several ways (in order of precedence):

1. Constructor parameter passed to SQLiteStorage
2. Environment variable: `SQLITE_DB_PATH`
3. Default path: `{process.cwd()}/data/reports.db`

## Testing

We've created a test script in `test-sqlite.js` that:
- Creates a test report
- Retrieves the report
- Deletes the report
- Verifies the report was deleted

Run the test with:
```bash
npm run test:sqlite
```

## Technical Details

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  share_id TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  user_id INTEGER
)
```

### Data Flow

1. **Creating a Share**:
   - User clicks "Share" button
   - Frontend generates a unique ID
   - Frontend serializes current analysis state
   - API request to `/api/reports` stores data in SQLite
   - Success response returns the share ID

2. **Accessing a Share**:
   - User visits URL with `?share={id}` parameter
   - Frontend extracts share ID from URL
   - API request to `/api/reports/{id}` retrieves data
   - Frontend loads the analysis state from the response

## Benefits

1. **Persistence**: Reports are stored in a durable SQLite database, ensuring they survive server restarts
2. **Simplicity**: SQLite requires no separate database server or complex configuration
3. **Performance**: better-sqlite3 provides excellent performance for the expected load
4. **Flexibility**: The database path can be configured via environment variables, making deployment in different environments easy

## Potential Improvements

1. **Authentication**: Add user authentication to protect reports
2. **Expiration**: Implement report expiration to clean up old reports
3. **Pagination**: Add pagination for listing reports
4. **Backup**: Implement database backup procedures

## Troubleshooting

### Common Issues

1. **Database Creation Errors**:
   - Check file system permissions
   - Verify the directory path exists
   - Check disk space

2. **Module Loading Errors**:
   - Ensure better-sqlite3 is installed
   - Check for version compatibility issues

3. **Query Errors**:
   - Check console logs for SQL errors
   - Verify schema matches expected structure

## Usage Examples

### Creating a Report Programmatically

```javascript
const report = {
  shareId: `report-${Date.now()}`,
  data: {
    metrics: { /* analysis metrics */ },
    overloadEvents: [ /* events data */ ]
  },
  description: "Performance analysis for server XYZ"
};

const savedReport = await storage.createReport(report);
console.log(`Report created with ID: ${savedReport.id}`);
```

### Retrieving a Report

```javascript
const shareId = "report-1681234567890";
const report = await storage.getReport(shareId);

if (report) {
  console.log("Report found:", report);
} else {
  console.log("Report not found");
}
