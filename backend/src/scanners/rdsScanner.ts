/**
 * RDS Security Scanner
 * Scans RDS instances against security best practices
 */

import { SecurityFinding, CheckStatus, Severity, ResourceType } from "../types";
import { getAllRDSInfo, RDSInstanceInfo } from "../aws/rds";

/**
 * Check: Public Accessibility
 * RDS instances should not be publicly accessible
 */
function checkPublicAccessibility(db: RDSInstanceInfo): SecurityFinding {
    return {
        resourceType: ResourceType.RDS,
        resourceId: db.dbInstanceId,
        checkName: "Public Accessibility",
        status: db.isPubliclyAccessible ? CheckStatus.FAIL : CheckStatus.PASS,
        severity: db.isPubliclyAccessible ? Severity.HIGH : Severity.LOW,
        message: db.isPubliclyAccessible
            ? "RDS instance is publicly accessible. This exposes your database to the internet"
            : "RDS instance is not publicly accessible"
    };
}

/**
 * Check: Encryption at Rest
 * RDS instances should have encryption enabled
 */
function checkEncryption(db: RDSInstanceInfo): SecurityFinding {
    return {
        resourceType: ResourceType.RDS,
        resourceId: db.dbInstanceId,
        checkName: "Encryption at Rest",
        status: db.isEncrypted ? CheckStatus.PASS : CheckStatus.FAIL,
        severity: db.isEncrypted ? Severity.LOW : Severity.MEDIUM,
        message: db.isEncrypted
            ? "Storage encryption is enabled"
            : "Storage encryption is NOT enabled. Data at rest is not protected"
    };
}

/**
 * Check: Backup Enabled
 * RDS instances should have automated backups enabled
 */
function checkBackupEnabled(db: RDSInstanceInfo): SecurityFinding {
    return {
        resourceType: ResourceType.RDS,
        resourceId: db.dbInstanceId,
        checkName: "Automated Backups",
        status: db.hasBackupEnabled ? CheckStatus.PASS : CheckStatus.FAIL,
        severity: db.hasBackupEnabled ? Severity.LOW : Severity.MEDIUM,
        message: db.hasBackupEnabled
            ? `Automated backups enabled with ${db.backupRetentionPeriod} day retention`
            : "Automated backups are NOT enabled. Enable for disaster recovery"
    };
}

/**
 * Check: Multi-AZ Deployment
 * Production RDS instances should use Multi-AZ for high availability
 */
function checkMultiAZ(db: RDSInstanceInfo): SecurityFinding {
    return {
        resourceType: ResourceType.RDS,
        resourceId: db.dbInstanceId,
        checkName: "Multi-AZ Deployment",
        status: db.multiAZ ? CheckStatus.PASS : CheckStatus.FAIL,
        severity: db.multiAZ ? Severity.LOW : Severity.LOW,
        message: db.multiAZ
            ? "Multi-AZ deployment is enabled for high availability"
            : "Multi-AZ deployment is NOT enabled. Consider for production workloads"
    };
}

/**
 * Run all RDS security checks
 */
export async function scanRDS(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    try {
        const instances = await getAllRDSInfo();
        console.log(`Scanning ${instances.length} RDS instances...`);

        for (const db of instances) {
            findings.push(checkPublicAccessibility(db));
            findings.push(checkEncryption(db));
            findings.push(checkBackupEnabled(db));
            findings.push(checkMultiAZ(db));
        }

        console.log(`RDS scan complete. Found ${findings.length} findings.`);
    } catch (error) {
        console.error("Error scanning RDS:", error);
        findings.push({
            resourceType: ResourceType.RDS,
            resourceId: "RDS-SCANNER",
            checkName: "RDS Scan",
            status: CheckStatus.ERROR,
            severity: Severity.HIGH,
            message: `Error scanning RDS: ${error}`
        });
    }

    return findings;
}
