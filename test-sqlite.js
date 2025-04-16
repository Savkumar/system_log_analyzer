// Simple test script for SQLite implementation
// Uses ES modules syntax since the project is set to type: "module"

// Import the storage module
import { storage } from './server/storage.js';

// Initialize environment
process.env.SQLITE_DB_PATH = './test-reports.db';

// Test report data
const testReport = {
  shareId: `test-${Date.now()}`,
  data: {
    metrics: {
      avgCpuUsage: 45.2,
      maxCpuUsage: 95.1,
      totalOverloads: 3
    },
    testInfo: "This is a test report",
    timestamp: new Date().toISOString()
  },
  description: "Test report created by test-sqlite.js"
};

// Run the tests
async function runTests() {
  try {
    console.log("Starting SQLite tests...");
    
    // Initialize storage
    console.log("Initializing database...");
    await storage.init();
    console.log("✅ Database initialized successfully");
    
    // Create a test report
    console.log(`Creating test report with ID: ${testReport.shareId}`);
    const createdReport = await storage.createReport(testReport);
    console.log("✅ Report created successfully:", createdReport.id);
    
    // Retrieve the report
    console.log("Retrieving report...");
    const retrievedReport = await storage.getReport(testReport.shareId);
    if (retrievedReport) {
      console.log("✅ Report retrieved successfully");
      console.log("Report details:", {
        id: retrievedReport.id,
        shareId: retrievedReport.shareId,
        description: retrievedReport.description,
        createdAt: retrievedReport.createdAt,
        dataKeys: Object.keys(retrievedReport.data)
      });
    } else {
      console.error("❌ Failed to retrieve report");
    }
    
    // Delete the report
    console.log("Deleting report...");
    const deleted = await storage.deleteReport(testReport.shareId);
    if (deleted) {
      console.log("✅ Report deleted successfully");
    } else {
      console.error("❌ Failed to delete report");
    }
    
    // Verify report is gone
    const shouldBeNull = await storage.getReport(testReport.shareId);
    if (!shouldBeNull) {
      console.log("✅ Report correctly not found after deletion");
    } else {
      console.error("❌ Report still exists after deletion");
    }
    
    console.log("\n✅ All tests completed successfully");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the tests
runTests();
