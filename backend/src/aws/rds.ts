/**
 * AWS RDS Client Module
 * Provides functions to interact with AWS RDS service
 * Uses read-only operations only - never modifies any resources
 */

import {
    RDSClient,
    DescribeDBInstancesCommand,
    DBInstance
} from "@aws-sdk/client-rds";
import { getAWSConfig } from "./config";

// Create RDS client with credentials from environment variables
const rdsClient = new RDSClient(getAWSConfig());

/**
 * RDS Instance information with security details
 */
export interface RDSInstanceInfo {
    dbInstanceId: string;
    dbInstanceClass: string;
    engine: string;
    engineVersion: string;
    status: string;
    isPubliclyAccessible: boolean;
    isEncrypted: boolean;
    hasBackupEnabled: boolean;
    backupRetentionPeriod: number;
    multiAZ: boolean;
    vpcSecurityGroups: string[];
    endpoint?: string;
    port?: number;
}

/**
 * Get all RDS instances in the account
 */
export async function listDBInstances(): Promise<DBInstance[]> {
    try {
        const response = await rdsClient.send(new DescribeDBInstancesCommand({}));
        return response.DBInstances || [];
    } catch (error) {
        console.error("Error listing RDS instances:", error);
        throw error;
    }
}

/**
 * Get complete information about all RDS instances
 */
export async function getAllRDSInfo(): Promise<RDSInstanceInfo[]> {
    const instances = await listDBInstances();
    const instancesInfo: RDSInstanceInfo[] = [];

    for (const instance of instances) {
        if (!instance.DBInstanceIdentifier) continue;

        // Get VPC security group IDs
        const vpcSecurityGroups = instance.VpcSecurityGroups?.map(
            sg => sg.VpcSecurityGroupId || ""
        ) || [];

        instancesInfo.push({
            dbInstanceId: instance.DBInstanceIdentifier,
            dbInstanceClass: instance.DBInstanceClass || "unknown",
            engine: instance.Engine || "unknown",
            engineVersion: instance.EngineVersion || "",
            status: instance.DBInstanceStatus || "unknown",
            isPubliclyAccessible: instance.PubliclyAccessible || false,
            isEncrypted: instance.StorageEncrypted || false,
            hasBackupEnabled: (instance.BackupRetentionPeriod || 0) > 0,
            backupRetentionPeriod: instance.BackupRetentionPeriod || 0,
            multiAZ: instance.MultiAZ || false,
            vpcSecurityGroups,
            endpoint: instance.Endpoint?.Address,
            port: instance.Endpoint?.Port
        });
    }

    return instancesInfo;
}
