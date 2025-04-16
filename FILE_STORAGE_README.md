# File-Based Report Storage Implementation

## Overview

This document outlines the implementation of a file-based storage system for report sharing in the Server Performance Analysis tool. This solution provides persistent storage for analysis reports, allowing users to share their analyses via URLs and access them across server restarts.

## Why File-Based Storage?

Due to compatibility issues with SQLite on older systems (particularly with C++20 requirements and native module compilation), we've implemented a simpler file-based storage solution that:

1. Has no native dependencies
2. Works with Node.js 16
3. Doesn't require C++ compilation
4. Provides the same functionality as the SQLite solution

## Implementation Components

### 1. Storage Interface (`server/file-storage.ts`)
- Implements the same `IStorage` interface as the original design
- Provides CRUD operations for reports
- Stores data as JSON files in a configurable directory

### 2. File Structure
- Reports are stored as individual JSON files
- Each report is named using its share ID (e.g., `data/reports/1681234567890-xyz.json`)
- User data is stored in a separate `users.json` file

### 3. API Integration
- The same API endpoints are used as before:
  - `POST /api/reports` - Create a new report
  - `GET /api/reports/:shareId` - Retrieve a shared report
  - `DELETE /api/reports/:shareId` - Delete a report

### 4. Testing
- A test script (`test-file-storage.js`) is provided to validate storage operations

## Configuration

The file storage system stores data in the following locations by default:
- Reports: `{process.cwd()}/data/reports/`
- Users: `{process.cwd()}/data/users.json`

You can configure an alternative data directory by passing a custom path to the FileStorage constructor:

```javascript
// Custom data directory
const storage = new FileStorage('/path/to/custom/data/directory');
```

## How the Report Sharing Works

1. When a user creates a shared report:
   - A unique ID is generated
   - The report data is serialized to JSON
   - A file is created with the share ID as the filename

2. When a shared report is accessed:
   - The share ID is extracted from the URL
   - The corresponding JSON file is loaded
   - The data is returned to the client

## Performance Considerations

- File-based storage is efficient for the relatively small number of reports expected
- JSON parsing/stringifying adds minimal overhead
- For very large datasets, consider implementing pagination or data filtering

## Security Considerations

1. Input validation is performed before storing data
2. File paths are sanitized to prevent path traversal attacks
3. Error handling prevents information disclosure

## Comparing with SQLite

| Feature | File-Based Storage | SQLite |
|---------|-------------------|--------|
| Dependencies | None (pure Node.js) | Native modules (sqlite3) |
| Queries | Simple file operations | SQL queries |
| Transactions | Not supported | Supported |
| Performance | Good for small datasets | Better for large datasets |
| Complexity | Lower | Higher |
| Compatibility | Works with Node.js 16+ | Requires newer Node.js/C++ |

## Troubleshooting

### Common Issues

1. **Permission Errors**:
   - Ensure the Node.js process has write permissions to the data directory
   - Check file ownership and permissions

2. **Missing Data**:
   - Verify the correct data directory is being used
   - Check for file system errors in the logs

3. **Performance Issues**:
   - For large numbers of reports, consider implementing pagination
   - Monitor disk space and I/O performance

## Future Improvements

1. **Data Indexing**: Implement in-memory indexing for faster lookups
2. **Report Expiration**: Add TTL (Time To Live) for reports
3. **Backup/Restore**: Add utilities for backing up and restoring data
4. **Compression**: Add optional compression for large reports
