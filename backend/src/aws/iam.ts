/**
 * AWS IAM Client Module
 * Provides functions to interact with AWS IAM service
 * Uses read-only operations only - never modifies any resources
 */

import {
    IAMClient,
    ListUsersCommand,
    ListMFADevicesCommand,
    ListAttachedUserPoliciesCommand,
    ListUserPoliciesCommand,
    GetAccountSummaryCommand,
    GetLoginProfileCommand,
    User,
    AttachedPolicy
} from "@aws-sdk/client-iam";
import { getAWSConfig } from "./config";

// Create IAM client - IAM is global, so region doesn't matter much
const iamClient = new IAMClient(getAWSConfig());

/**
 * IAM User information with security details
 */
export interface IAMUserInfo {
    userName: string;
    userId: string;
    arn: string;
    createDate?: Date;
    hasMFA: boolean;
    hasConsoleAccess: boolean;
    attachedPolicies: string[];
    hasAdminAccess: boolean;
    passwordLastUsed?: Date;
}

/**
 * Account-level IAM summary
 */
export interface IAMAccountSummary {
    users: number;
    groups: number;
    roles: number;
    policies: number;
    mfaDevices: number;
    accountMFAEnabled: boolean;
}

/**
 * Known admin-level policy ARNs that grant full access
 */
const ADMIN_POLICY_ARNS = [
    "arn:aws:iam::aws:policy/AdministratorAccess",
    "arn:aws:iam::aws:policy/PowerUserAccess",
    "arn:aws:iam::aws:policy/IAMFullAccess"
];

/**
 * Check if a policy grants admin-like permissions
 */
function isAdminPolicy(policyArn: string): boolean {
    return ADMIN_POLICY_ARNS.includes(policyArn);
}

/**
 * Get list of all IAM users
 */
export async function listUsers(): Promise<User[]> {
    try {
        const response = await iamClient.send(new ListUsersCommand({}));
        return response.Users || [];
    } catch (error) {
        console.error("Error listing IAM users:", error);
        throw error;
    }
}

/**
 * Check if a user has MFA enabled
 */
export async function userHasMFA(userName: string): Promise<boolean> {
    try {
        const response = await iamClient.send(
            new ListMFADevicesCommand({ UserName: userName })
        );
        return (response.MFADevices?.length || 0) > 0;
    } catch (error) {
        console.error(`Error checking MFA for user ${userName}:`, error);
        return false;
    }
}

/**
 * Check if a user has console access (login profile)
 */
export async function userHasConsoleAccess(userName: string): Promise<boolean> {
    try {
        await iamClient.send(
            new GetLoginProfileCommand({ UserName: userName })
        );
        return true;
    } catch (error: any) {
        // NoSuchEntity means no console access
        if (error.name === "NoSuchEntityException") {
            return false;
        }
        console.error(`Error checking console access for user ${userName}:`, error);
        return false;
    }
}

/**
 * Get attached policies for a user
 */
export async function getUserAttachedPolicies(userName: string): Promise<AttachedPolicy[]> {
    try {
        const response = await iamClient.send(
            new ListAttachedUserPoliciesCommand({ UserName: userName })
        );
        return response.AttachedPolicies || [];
    } catch (error) {
        console.error(`Error getting policies for user ${userName}:`, error);
        return [];
    }
}

/**
 * Get inline policy names for a user
 */
export async function getUserInlinePolicies(userName: string): Promise<string[]> {
    try {
        const response = await iamClient.send(
            new ListUserPoliciesCommand({ UserName: userName })
        );
        return response.PolicyNames || [];
    } catch (error) {
        console.error(`Error getting inline policies for user ${userName}:`, error);
        return [];
    }
}

/**
 * Get account summary including root MFA status
 */
export async function getAccountSummary(): Promise<IAMAccountSummary> {
    try {
        const response = await iamClient.send(new GetAccountSummaryCommand({}));
        const summary = response.SummaryMap || {};

        return {
            users: summary["Users"] || 0,
            groups: summary["Groups"] || 0,
            roles: summary["Roles"] || 0,
            policies: summary["Policies"] || 0,
            mfaDevices: summary["MFADevices"] || 0,
            accountMFAEnabled: (summary["AccountMFAEnabled"] || 0) === 1
        };
    } catch (error) {
        console.error("Error getting account summary:", error);
        throw error;
    }
}

/**
 * Get complete information about all IAM users
 */
export async function getAllUsersInfo(): Promise<IAMUserInfo[]> {
    const users = await listUsers();
    const usersInfo: IAMUserInfo[] = [];

    for (const user of users) {
        if (!user.UserName) continue;

        const userName = user.UserName;

        // Fetch all details in parallel
        const [hasMFA, hasConsoleAccess, attachedPolicies] = await Promise.all([
            userHasMFA(userName),
            userHasConsoleAccess(userName),
            getUserAttachedPolicies(userName)
        ]);

        // Check for admin access
        const policyArns = attachedPolicies.map(p => p.PolicyArn || "");
        const hasAdminAccess = policyArns.some(isAdminPolicy);

        usersInfo.push({
            userName,
            userId: user.UserId || "",
            arn: user.Arn || "",
            createDate: user.CreateDate,
            hasMFA,
            hasConsoleAccess,
            attachedPolicies: policyArns,
            hasAdminAccess,
            passwordLastUsed: user.PasswordLastUsed
        });
    }

    return usersInfo;
}
