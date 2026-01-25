/**
 * S3 Security Scanner
 * Scans S3 buckets against security best practices
 */

import { SecurityFinding, CheckStatus, Severity, ResourceType } from "../types";
import { getAllBucketsInfo, S3BucketInfo } from "../aws/s3";

/**
 * Check: Public Access Block
 * Verifies that S3 bucket has public access blocked
 */
function checkPublicAccess(bucket: S3BucketInfo): SecurityFinding {
    const isBlocked = bucket.publicAccess.isFullyBlocked;

    return {
        resourceType: ResourceType.S3,
        resourceId: bucket.name,
        checkName: "Public Access Block",
        status: isBlocked ? CheckStatus.PASS : CheckStatus.FAIL,
        severity: isBlocked ? Severity.LOW : Severity.HIGH,
        message: isBlocked
            ? "Public access is fully blocked for this bucket"
            : "Public access is NOT fully blocked. This bucket may be publicly accessible",
        region: bucket.region
    };
}

/**
 * Check: Server-Side Encryption
 * Verifies that S3 bucket has encryption enabled
 */
function checkEncryption(bucket: S3BucketInfo): SecurityFinding {
    const isEncrypted = bucket.encryption.enabled;
    const encryptionType = bucket.encryption.type || "None";

    return {
        resourceType: ResourceType.S3,
        resourceId: bucket.name,
        checkName: "Server-Side Encryption",
        status: isEncrypted ? CheckStatus.PASS : CheckStatus.FAIL,
        severity: isEncrypted ? Severity.LOW : Severity.MEDIUM,
        message: isEncrypted
            ? `Encryption is enabled using ${encryptionType}`
            : "Server-side encryption is NOT enabled. Data at rest is not protected",
        region: bucket.region
    };
}

/**
 * Check: Versioning
 * Verifies that S3 bucket has versioning enabled for data protection
 */
function checkVersioning(bucket: S3BucketInfo): SecurityFinding {
    const isEnabled = bucket.versioning.enabled;

    return {
        resourceType: ResourceType.S3,
        resourceId: bucket.name,
        checkName: "Versioning",
        status: isEnabled ? CheckStatus.PASS : CheckStatus.FAIL,
        severity: isEnabled ? Severity.LOW : Severity.LOW,
        message: isEnabled
            ? "Versioning is enabled - objects can be recovered if deleted"
            : "Versioning is NOT enabled. Consider enabling for data protection",
        region: bucket.region
    };
}

/**
 * Run all S3 security checks
 */
export async function scanS3Buckets(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    try {
        const buckets = await getAllBucketsInfo();
        console.log(`Scanning ${buckets.length} S3 buckets...`);

        for (const bucket of buckets) {
            // Run all checks for each bucket
            findings.push(checkPublicAccess(bucket));
            findings.push(checkEncryption(bucket));
            findings.push(checkVersioning(bucket));
        }

        console.log(`S3 scan complete. Found ${findings.length} findings.`);
    } catch (error) {
        console.error("Error scanning S3 buckets:", error);
        findings.push({
            resourceType: ResourceType.S3,
            resourceId: "S3-SCANNER",
            checkName: "S3 Scan",
            status: CheckStatus.ERROR,
            severity: Severity.HIGH,
            message: `Error scanning S3 buckets: ${error}`
        });
    }

    return findings;
}
