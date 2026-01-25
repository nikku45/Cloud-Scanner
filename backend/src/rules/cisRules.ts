/**
 * CIS AWS Foundations Benchmark Rules
 * Reference implementation of common security rules
 * Based on CIS AWS Foundations Benchmark v1.4.0
 */

import { Severity, ResourceType, CheckStatus } from "../types";

/**
 * Security rule definition
 */
export interface SecurityRule {
    id: string;
    name: string;
    description: string;
    resourceType: ResourceType;
    severity: Severity;
    category: string;
    recommendation: string;
}

/**
 * CIS Benchmark rules we check
 */
export const CIS_RULES: SecurityRule[] = [
    // IAM Rules
    {
        id: "CIS-1.5",
        name: "Root Account MFA",
        description: "Ensure MFA is enabled for the root user account",
        resourceType: ResourceType.IAM,
        severity: Severity.CRITICAL,
        category: "Identity and Access Management",
        recommendation: "Enable MFA for the root account in the IAM console"
    },
    {
        id: "CIS-1.10",
        name: "IAM User MFA",
        description: "Ensure MFA is enabled for all IAM users with console access",
        resourceType: ResourceType.IAM,
        severity: Severity.HIGH,
        category: "Identity and Access Management",
        recommendation: "Enable MFA for all IAM users through the IAM console"
    },
    {
        id: "CIS-1.16",
        name: "Admin Access Review",
        description: "Ensure IAM policies are attached only to groups or roles",
        resourceType: ResourceType.IAM,
        severity: Severity.MEDIUM,
        category: "Identity and Access Management",
        recommendation: "Review users with admin access and use least privilege principle"
    },

    // S3 Rules
    {
        id: "CIS-2.1.1",
        name: "S3 Public Access",
        description: "Ensure S3 bucket public access is blocked",
        resourceType: ResourceType.S3,
        severity: Severity.HIGH,
        category: "Storage",
        recommendation: "Enable 'Block all public access' setting on S3 buckets"
    },
    {
        id: "CIS-2.1.2",
        name: "S3 Encryption",
        description: "Ensure S3 bucket server-side encryption is enabled",
        resourceType: ResourceType.S3,
        severity: Severity.MEDIUM,
        category: "Storage",
        recommendation: "Enable default encryption on S3 buckets using SSE-S3 or SSE-KMS"
    },
    {
        id: "CIS-2.1.3",
        name: "S3 Versioning",
        description: "Ensure S3 bucket versioning is enabled",
        resourceType: ResourceType.S3,
        severity: Severity.LOW,
        category: "Storage",
        recommendation: "Enable versioning on S3 buckets for data protection"
    },

    // EC2/VPC Rules
    {
        id: "CIS-5.1",
        name: "Security Group SSH Restriction",
        description: "Ensure no security groups allow ingress from 0.0.0.0/0 to port 22",
        resourceType: ResourceType.SECURITY_GROUP,
        severity: Severity.HIGH,
        category: "Networking",
        recommendation: "Restrict SSH access to specific IP addresses"
    },
    {
        id: "CIS-5.2",
        name: "Security Group RDP Restriction",
        description: "Ensure no security groups allow ingress from 0.0.0.0/0 to port 3389",
        resourceType: ResourceType.SECURITY_GROUP,
        severity: Severity.HIGH,
        category: "Networking",
        recommendation: "Restrict RDP access to specific IP addresses"
    },
    {
        id: "CIS-5.3",
        name: "Security Group Unrestricted Access",
        description: "Ensure security groups do not allow unrestricted ingress",
        resourceType: ResourceType.SECURITY_GROUP,
        severity: Severity.MEDIUM,
        category: "Networking",
        recommendation: "Review and restrict ingress rules to specific IPs and ports"
    },

    // RDS Rules
    {
        id: "CIS-2.3.1",
        name: "RDS Public Accessibility",
        description: "Ensure RDS instances are not publicly accessible",
        resourceType: ResourceType.RDS,
        severity: Severity.HIGH,
        category: "Database",
        recommendation: "Disable public accessibility for RDS instances"
    },
    {
        id: "CIS-2.3.2",
        name: "RDS Encryption",
        description: "Ensure RDS instances have encryption at rest enabled",
        resourceType: ResourceType.RDS,
        severity: Severity.MEDIUM,
        category: "Database",
        recommendation: "Enable encryption when creating RDS instances"
    },
    {
        id: "CIS-2.3.3",
        name: "RDS Automated Backups",
        description: "Ensure RDS instances have automated backups enabled",
        resourceType: ResourceType.RDS,
        severity: Severity.MEDIUM,
        category: "Database",
        recommendation: "Enable automated backups with appropriate retention period"
    }
];

/**
 * Get rule by ID
 */
export function getRuleById(ruleId: string): SecurityRule | undefined {
    return CIS_RULES.find(rule => rule.id === ruleId);
}

/**
 * Get all rules for a resource type
 */
export function getRulesByResourceType(resourceType: ResourceType): SecurityRule[] {
    return CIS_RULES.filter(rule => rule.resourceType === resourceType);
}

/**
 * Get all rules by category
 */
export function getRulesByCategory(category: string): SecurityRule[] {
    return CIS_RULES.filter(rule => rule.category === category);
}
