/**
 * IAM Security Scanner
 * Scans IAM users and account settings against security best practices
 */

import { SecurityFinding, CheckStatus, Severity, ResourceType } from "../types";
import { getAllUsersInfo, getAccountSummary, IAMUserInfo } from "../aws/iam";

/**
 * Check: MFA Enabled
 * All IAM users with console access should have MFA enabled
 */
function checkMFAEnabled(user: IAMUserInfo): SecurityFinding {
    // Only check MFA for users with console access
    if (!user.hasConsoleAccess) {
        return {
            resourceType: ResourceType.IAM,
            resourceId: user.userName,
            checkName: "MFA Enabled",
            status: CheckStatus.PASS,
            severity: Severity.LOW,
            message: "User does not have console access, MFA not required"
        };
    }

    return {
        resourceType: ResourceType.IAM,
        resourceId: user.userName,
        checkName: "MFA Enabled",
        status: user.hasMFA ? CheckStatus.PASS : CheckStatus.FAIL,
        severity: user.hasMFA ? Severity.LOW : Severity.HIGH,
        message: user.hasMFA
            ? "MFA is enabled for this user"
            : "MFA is NOT enabled. User with console access should have MFA"
    };
}

/**
 * Check: Admin Access
 * Users with admin-level permissions should be carefully reviewed
 */
function checkAdminAccess(user: IAMUserInfo): SecurityFinding {
    return {
        resourceType: ResourceType.IAM,
        resourceId: user.userName,
        checkName: "Admin Access Check",
        status: user.hasAdminAccess ? CheckStatus.FAIL : CheckStatus.PASS,
        severity: user.hasAdminAccess ? Severity.HIGH : Severity.LOW,
        message: user.hasAdminAccess
            ? `User has admin-level permissions. Ensure this is necessary`
            : "User does not have admin-level permissions"
    };
}

/**
 * Check: Root Account MFA
 * The root account should always have MFA enabled
 */
function checkRootMFA(accountMFAEnabled: boolean): SecurityFinding {
    return {
        resourceType: ResourceType.IAM,
        resourceId: "ROOT-ACCOUNT",
        checkName: "Root Account MFA",
        status: accountMFAEnabled ? CheckStatus.PASS : CheckStatus.FAIL,
        severity: accountMFAEnabled ? Severity.LOW : Severity.CRITICAL,
        message: accountMFAEnabled
            ? "Root account has MFA enabled"
            : "Root account does NOT have MFA enabled. This is a critical security risk"
    };
}

/**
 * Run all IAM security checks
 */
export async function scanIAM(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    try {
        // Get users and account summary in parallel
        const [users, accountSummary] = await Promise.all([
            getAllUsersInfo(),
            getAccountSummary()
        ]);

        console.log(`Scanning ${users.length} IAM users...`);

        // Check root account MFA
        findings.push(checkRootMFA(accountSummary.accountMFAEnabled));

        // Scan all users
        for (const user of users) {
            findings.push(checkMFAEnabled(user));
            findings.push(checkAdminAccess(user));
        }

        console.log(`IAM scan complete. Found ${findings.length} findings.`);
    } catch (error) {
        console.error("Error scanning IAM:", error);
        findings.push({
            resourceType: ResourceType.IAM,
            resourceId: "IAM-SCANNER",
            checkName: "IAM Scan",
            status: CheckStatus.ERROR,
            severity: Severity.HIGH,
            message: `Error scanning IAM: ${error}`
        });
    }

    return findings;
}
