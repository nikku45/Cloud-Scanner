/**
 * CSPM Types and Enums
 * These define the standardized output format for all security checks
 */

// Severity levels for security findings
export enum Severity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}

// Status of each security check
export enum CheckStatus {
    PASS = "PASS",
    FAIL = "FAIL",
    ERROR = "ERROR"  // When we can't determine the status
}

// AWS Resource types we scan
export enum ResourceType {
    S3 = "S3",
    EC2 = "EC2",
    IAM = "IAM",
    RDS = "RDS",
    SECURITY_GROUP = "SECURITY_GROUP"
}

/**
 * Standardized security finding format
 * Every security check must return data in this format
 */
export interface SecurityFinding {
    resourceType: ResourceType;
    resourceId: string;
    checkName: string;
    status: CheckStatus;
    severity: Severity;
    message: string;
    timestamp?: Date;
    region?: string;
}

/**
 * Scan summary for dashboard overview
 */
export interface ScanSummary {
    totalResources: number;
    passed: number;
    failed: number;
    errors: number;
    highSeverity: number;
    criticalSeverity: number;
    scanTime: Date;
}

/**
 * Complete scan result with findings and summary
 */
export interface ScanResult {
    id: string;
    summary: ScanSummary;
    findings: SecurityFinding[];
    startTime: Date;
    endTime?: Date;
    status: "running" | "completed" | "failed";
}

/**
 * AWS Client configuration
 */
export interface AWSConfig {
    region: string;
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
    };
}
