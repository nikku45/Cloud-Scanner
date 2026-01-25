import dotenv from "dotenv";


dotenv.config();

import app from "./app";
import { validateAWSCredentials } from "./aws/config";

// Get port from environment or use default
const PORT = process.env.PORT || 5000;

// Validate AWS credentials on startup
const credentialCheck = validateAWSCredentials();
console.log("\n========================================");
console.log("  CSPM - Cloud Security Posture Management");
console.log("========================================\n");
console.log(`AWS Credentials: ${credentialCheck.message}`);
console.log(`AWS Region: ${process.env.AWS_REGION || "us-east-1"}`);

// Start the server
app.listen(PORT, () => {
    console.log(`\nServer running on http://localhost:${PORT}`);
    console.log("\nAvailable API Endpoints:");
    console.log("  GET  /api/health   - Health check");
    console.log("  POST /api/scan     - Trigger security scan");
    console.log("  GET  /api/results  - Get latest scan results");
    console.log("  GET  /api/summary  - Get scan summary");
    console.log("  GET  /api/history  - Get scan history");
    console.log("\n========================================\n");
});
