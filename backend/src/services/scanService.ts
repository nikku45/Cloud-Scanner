
import { v4 as uuidv4 } from "uuid";
import {
    SecurityFinding,
    ScanResult,
    ScanSummary,
    CheckStatus,
    Severity
} from "../types";
import { scanS3Buckets } from "../scanners/s3Scanner";
import { scanEC2 } from "../scanners/ec2Scanner";
import { scanIAM } from "../scanners/iamScanner";
import { scanRDS } from "../scanners/rdsScanner";
import { saveScanResult, getLatestScanResult } from "../storage/dynamodb";


function generateScanId(): string {
    return `scan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}


// const scanHistory: ScanResult[] = [];

/**
 * Maximum number of scans to keep in history
 */
// const MAX_SCAN_HISTORY = 100;


function calculateSummary(findings: SecurityFinding[]): ScanSummary {
    const passed = findings.filter(f => f.status === CheckStatus.PASS).length;
    const failed = findings.filter(f => f.status === CheckStatus.FAIL).length;
    const errors = findings.filter(f => f.status === CheckStatus.ERROR).length;
    const highSeverity = findings.filter(
        f => f.status === CheckStatus.FAIL && f.severity === Severity.HIGH
    ).length;
    const criticalSeverity = findings.filter(
        f => f.status === CheckStatus.FAIL && f.severity === Severity.CRITICAL
    ).length;

    return {
        totalResources: findings.length,
        passed,
        failed,
        errors,
        highSeverity,
        criticalSeverity,
        scanTime: new Date()
    };
}

/**
 * Run a complete security scan across all AWS services
 */
export async function runFullScan(): Promise<ScanResult> {
    const scanId = generateScanId();
    const startTime = new Date();

    console.log(`\n========== Starting Security Scan: ${scanId} ==========`);
    console.log(`Start Time: ${startTime.toISOString()}\n`);

    // Create initial scan result
    const scanResult: ScanResult = {
        scanId: scanId,
        summary: {
            totalResources: 0,
            passed: 0,
            failed: 0,
            errors: 0,
            highSeverity: 0,
            criticalSeverity: 0,
            scanTime: startTime
        },
        findings: [],
        startTime,
        status: "running"
    };

    try {
        // Run all scanners in parallel for better performance
        const [s3Findings, ec2Findings, iamFindings, rdsFindings] = await Promise.all([
            scanS3Buckets().catch(err => {
                console.error("S3 scan failed:", err);
                return [] as SecurityFinding[];
            }),
            scanEC2().catch(err => {
                console.error("EC2 scan failed:", err);
                return [] as SecurityFinding[];
            }),
            scanIAM().catch(err => {
                console.error("IAM scan failed:", err);
                return [] as SecurityFinding[];
            }),
            scanRDS().catch(err => {
                console.error("RDS scan failed:", err);
                return [] as SecurityFinding[];
            })
        ]);

        // Combine all findings
        const allFindings = [
            ...s3Findings,
            ...ec2Findings,
            ...iamFindings,
            ...rdsFindings
        ];

        // Add timestamps to findings
        const timestamp = new Date();
        allFindings.forEach(finding => {
            finding.timestamp = timestamp;
        });

        // Calculates summary
        const summary = calculateSummary(allFindings);

        // Update scan result
        scanResult.findings = allFindings;
        scanResult.summary = summary;
        scanResult.endTime = new Date();
        scanResult.status = "completed";

        console.log(`\n========== Scan Complete: ${scanId} ==========`);
        console.log(`Total Checks: ${summary.totalResources}`);
        console.log(`Passed: ${summary.passed}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`High Severity: ${summary.highSeverity}`);
        console.log(`Critical Severity: ${summary.criticalSeverity}`);
        console.log(`Duration: ${(scanResult.endTime.getTime() - startTime.getTime()) / 1000}s\n`);

    } catch (error) {
        console.error("Scan failed:", error);
        scanResult.status = "failed";
        scanResult.endTime = new Date();
    }

    // Store in history (keep only last N scans)
    saveScanResult(scanResult)
    // scanHistory.unshift(scanResult);
    // if (scanHistory.length > MAX_SCAN_HISTORY) {
    //     scanHistory.pop();
    // }

    return scanResult;
}

/**
 * Get the latest scan result
 */
export async function getLatestScan(): Promise<ScanResult | null> {
    const latestScanResult = await getLatestScanResult();
    if (!latestScanResult) {
        return null;
    }
    return latestScanResult;
}

/**
 * Get all scan history
 */
// export function getScanHistory(): ScanResult[] {
//     return scanHistory;
// }

/**
 * Get a specific scan by ID
 */
// export function getScanById(scanId: string): ScanResult | undefined {
//     return scanHistory.find(scan => scan.scanId === scanId);
// }

/**
 * Get summary of the latest scan
 */
export async function getLatestSummary(): Promise<ScanSummary | null> {
    const latest = await getLatestScan();
    return latest ? latest.summary : null;
}

/**
 * Clear scan history (useful for testing)
 */
// export function clearHistory(): void {
//     scanHistory.length = 0;
// }
