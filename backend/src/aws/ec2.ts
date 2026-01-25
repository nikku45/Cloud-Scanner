/**
 * AWS EC2 Client Module
 * Provides functions to interact with AWS EC2 service
 * Uses read-only operations only - never modifies any resources
 */

import {
    EC2Client,
    DescribeInstancesCommand,
    DescribeSecurityGroupsCommand,
    Instance,
    SecurityGroup,
    IpPermission
} from "@aws-sdk/client-ec2";
import { getAWSConfig } from "./config";

// Create EC2 client with credentials from environment variables
const ec2Client = new EC2Client(getAWSConfig());

/**
 * EC2 Instance information with security details
 */
export interface EC2InstanceInfo {
    instanceId: string;
    name: string;
    state: string;
    instanceType: string;
    publicIp?: string;
    privateIp?: string;
    hasPublicIp: boolean;
    securityGroups: string[];
    region?: string;
}

/**
 * Security Group information with rule analysis
 */
export interface SecurityGroupInfo {
    groupId: string;
    groupName: string;
    description: string;
    vpcId?: string;
    inboundRules: SecurityGroupRule[];
    hasOpenSSH: boolean;      // Port 22 open to 0.0.0.0/0
    hasOpenRDP: boolean;      // Port 3389 open to 0.0.0.0/0
    hasOpenToWorld: boolean;  // Any port open to 0.0.0.0/0
}

/**
 * Individual security group rule
 */
export interface SecurityGroupRule {
    protocol: string;
    fromPort?: number;
    toPort?: number;
    source: string;
    isOpenToWorld: boolean;
}

/**
 * Get all EC2 instances in the account
 */
export async function listInstances(): Promise<EC2InstanceInfo[]> {
    try {
        const response = await ec2Client.send(new DescribeInstancesCommand({}));
        const instances: EC2InstanceInfo[] = [];

        // Iterate through reservations and instances
        for (const reservation of response.Reservations || []) {
            for (const instance of reservation.Instances || []) {
                if (!instance.InstanceId) continue;

                // Get instance name from tags
                const nameTag = instance.Tags?.find(tag => tag.Key === "Name");
                const name = nameTag?.Value || "Unnamed";

                // Get security group IDs
                const securityGroups = instance.SecurityGroups?.map(sg => sg.GroupId || "") || [];

                instances.push({
                    instanceId: instance.InstanceId,
                    name,
                    state: instance.State?.Name || "unknown",
                    instanceType: instance.InstanceType || "unknown",
                    publicIp: instance.PublicIpAddress,
                    privateIp: instance.PrivateIpAddress,
                    hasPublicIp: !!instance.PublicIpAddress,
                    securityGroups
                });
            }
        }

        return instances;
    } catch (error) {
        console.error("Error listing EC2 instances:", error);
        throw error;
    }
}

/**
 * Check if a CIDR block represents "open to world" (0.0.0.0/0 or ::/0)
 */
function isOpenToWorld(cidr: string): boolean {
    return cidr === "0.0.0.0/0" || cidr === "::/0";
}

/**
 * Parse security group rules and identify risky configurations
 */
function parseInboundRules(permissions: IpPermission[]): SecurityGroupRule[] {
    const rules: SecurityGroupRule[] = [];

    for (const permission of permissions) {
        // Check IPv4 ranges
        for (const ipRange of permission.IpRanges || []) {
            rules.push({
                protocol: permission.IpProtocol || "all",
                fromPort: permission.FromPort,
                toPort: permission.ToPort,
                source: ipRange.CidrIp || "",
                isOpenToWorld: isOpenToWorld(ipRange.CidrIp || "")
            });
        }

        // Check IPv6 ranges
        for (const ipv6Range of permission.Ipv6Ranges || []) {
            rules.push({
                protocol: permission.IpProtocol || "all",
                fromPort: permission.FromPort,
                toPort: permission.ToPort,
                source: ipv6Range.CidrIpv6 || "",
                isOpenToWorld: isOpenToWorld(ipv6Range.CidrIpv6 || "")
            });
        }
    }

    return rules;
}

/**
 * Check if any rule exposes a specific port to the world
 */
function hasPortOpenToWorld(rules: SecurityGroupRule[], port: number): boolean {
    return rules.some(rule => {
        if (!rule.isOpenToWorld) return false;

        // Protocol -1 means all traffic
        if (rule.protocol === "-1") return true;

        // Check if port falls within the rule's port range
        const fromPort = rule.fromPort ?? 0;
        const toPort = rule.toPort ?? 65535;

        return port >= fromPort && port <= toPort;
    });
}

/**
 * Get all security groups with analysis
 */
export async function listSecurityGroups(): Promise<SecurityGroupInfo[]> {
    try {
        const response = await ec2Client.send(new DescribeSecurityGroupsCommand({}));
        const securityGroups: SecurityGroupInfo[] = [];

        for (const sg of response.SecurityGroups || []) {
            if (!sg.GroupId) continue;

            const inboundRules = parseInboundRules(sg.IpPermissions || []);

            // Check for risky configurations
            const hasOpenSSH = hasPortOpenToWorld(inboundRules, 22);
            const hasOpenRDP = hasPortOpenToWorld(inboundRules, 3389);
            const hasOpenToWorld = inboundRules.some(rule => rule.isOpenToWorld);

            securityGroups.push({
                groupId: sg.GroupId,
                groupName: sg.GroupName || "Unknown",
                description: sg.Description || "",
                vpcId: sg.VpcId,
                inboundRules,
                hasOpenSSH,
                hasOpenRDP,
                hasOpenToWorld
            });
        }

        return securityGroups;
    } catch (error) {
        console.error("Error listing security groups:", error);
        throw error;
    }
}

/**
 * Get all EC2 and Security Group information
 */
export async function getEC2SecurityInfo(): Promise<{
    instances: EC2InstanceInfo[];
    securityGroups: SecurityGroupInfo[];
}> {
    const [instances, securityGroups] = await Promise.all([
        listInstances(),
        listSecurityGroups()
    ]);

    return { instances, securityGroups };
}
