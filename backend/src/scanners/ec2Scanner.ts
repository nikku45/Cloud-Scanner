/**
 * EC2 Security Scanner
 * Scans EC2 instances and security groups against security best practices
 */

import { SecurityFinding, CheckStatus, Severity, ResourceType } from "../types";
import {
    getEC2SecurityInfo,
    EC2InstanceInfo,
    SecurityGroupInfo
} from "../aws/ec2";

/**
 * Check: SSH Port Exposure (Port 22)
 * Security groups should not allow SSH access from anywhere (0.0.0.0/0)
 */
function checkSSHExposure(sg: SecurityGroupInfo): SecurityFinding {
    return {
        resourceType: ResourceType.SECURITY_GROUP,
        resourceId: `${sg.groupName} (${sg.groupId})`,
        checkName: "SSH Port Exposure (22)",
        status: sg.hasOpenSSH ? CheckStatus.FAIL : CheckStatus.PASS,
        severity: sg.hasOpenSSH ? Severity.HIGH : Severity.LOW,
        message: sg.hasOpenSSH
            ? "SSH port 22 is open to the world (0.0.0.0/0). Restrict to specific IPs"
            : "SSH port 22 is not exposed to the world"
    };
}

/**
 * Check: RDP Port Exposure (Port 3389)
 * Security groups should not allow RDP access from anywhere (0.0.0.0/0)
 */
function checkRDPExposure(sg: SecurityGroupInfo): SecurityFinding {
    return {
        resourceType: ResourceType.SECURITY_GROUP,
        resourceId: `${sg.groupName} (${sg.groupId})`,
        checkName: "RDP Port Exposure (3389)",
        status: sg.hasOpenRDP ? CheckStatus.FAIL : CheckStatus.PASS,
        severity: sg.hasOpenRDP ? Severity.HIGH : Severity.LOW,
        message: sg.hasOpenRDP
            ? "RDP port 3389 is open to the world (0.0.0.0/0). Restrict to specific IPs"
            : "RDP port 3389 is not exposed to the world"
    };
}

/**
 * Check: Open to World
 * Security groups should not allow unrestricted access from 0.0.0.0/0
 */
function checkOpenToWorld(sg: SecurityGroupInfo): SecurityFinding {
    // Count how many rules are open to world
    const openRules = sg.inboundRules.filter(r => r.isOpenToWorld);

    return {
        resourceType: ResourceType.SECURITY_GROUP,
        resourceId: `${sg.groupName} (${sg.groupId})`,
        checkName: "Unrestricted Inbound Access",
        status: sg.hasOpenToWorld ? CheckStatus.FAIL : CheckStatus.PASS,
        severity: sg.hasOpenToWorld ? Severity.MEDIUM : Severity.LOW,
        message: sg.hasOpenToWorld
            ? `${openRules.length} inbound rule(s) allow traffic from 0.0.0.0/0`
            : "No inbound rules allow unrestricted access"
    };
}

/**
 * Check: Public IP Exposure
 * Instances with public IPs are directly accessible from the internet
 */
function checkPublicIPExposure(instance: EC2InstanceInfo): SecurityFinding {
    return {
        resourceType: ResourceType.EC2,
        resourceId: `${instance.name} (${instance.instanceId})`,
        checkName: "Public IP Exposure",
        status: instance.hasPublicIp ? CheckStatus.FAIL : CheckStatus.PASS,
        severity: instance.hasPublicIp ? Severity.MEDIUM : Severity.LOW,
        message: instance.hasPublicIp
            ? `Instance has a public IP: ${instance.publicIp}. Ensure this is intentional`
            : "Instance does not have a public IP"
    };
}

/**
 * Run all EC2 and Security Group security checks
 */
export async function scanEC2(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    try {
        const { instances, securityGroups } = await getEC2SecurityInfo();

        console.log(`Scanning ${instances.length} EC2 instances...`);
        console.log(`Scanning ${securityGroups.length} Security Groups...`);

        // Scan all security groups
        for (const sg of securityGroups) {
            findings.push(checkSSHExposure(sg));
            findings.push(checkRDPExposure(sg));
            findings.push(checkOpenToWorld(sg));
        }

        // Scan all instances (only running ones)
        for (const instance of instances) {
            if (instance.state === "running" || instance.state === "stopped") {
                findings.push(checkPublicIPExposure(instance));
            }
        }

        console.log(`EC2 scan complete. Found ${findings.length} findings.`);
    } catch (error) {
        console.error("Error scanning EC2:", error);
        findings.push({
            resourceType: ResourceType.EC2,
            resourceId: "EC2-SCANNER",
            checkName: "EC2 Scan",
            status: CheckStatus.ERROR,
            severity: Severity.HIGH,
            message: `Error scanning EC2: ${error}`
        });
    }

    return findings;
}
