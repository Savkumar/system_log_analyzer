// Simple test script for File-based Storage implementation

// Import the storage module
import { storage } from './server/file-storage.js';

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
  description: "Test report created by test-file-storage.js"
};

// Run the tests
async function runTests() {
  try {
    console.log("Starting File Storage tests...");
    
    // Initialize storage
    console.log("Initializing file storage...");
    await storage.init();
    console.log("✅ File storage initialized successfully");
    
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
