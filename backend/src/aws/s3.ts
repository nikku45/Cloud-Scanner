/**
 * AWS S3 Client Module
 * Provides functions to interact with AWS S3 service
 * Uses read-only operations only - never modifies any resources
 */

import {
    S3Client,
    ListBucketsCommand,
    GetBucketLocationCommand,
    GetBucketEncryptionCommand,
    GetBucketVersioningCommand,
    GetPublicAccessBlockCommand,
    Bucket,
    PublicAccessBlockConfiguration,
    ServerSideEncryptionConfiguration
} from "@aws-sdk/client-s3";
import { getAWSConfig } from "./config";

// Create S3 client with credentials from environment variables
const s3Client = new S3Client(getAWSConfig());
// console.log(s3Client);

/**
 * S3 Bucket information with security details
 */
export interface S3BucketInfo {
    name: string;
    region: string;
    creationDate?: Date;
    publicAccess: {
        blockPublicAcls: boolean;
        blockPublicPolicy: boolean;
        ignorePublicAcls: boolean;
        restrictPublicBuckets: boolean;
        isFullyBlocked: boolean;
    };
    encryption: {
        enabled: boolean;
        type?: string;
    };
    versioning: {
        enabled: boolean;
        mfaDelete: boolean;
    };
}

/**
 * Get list of all S3 buckets in the account
 */
export async function listBuckets(): Promise<Bucket[]> {
    try {
        const response = await s3Client.send(new ListBucketsCommand({}));
        return response.Buckets || [];
    } catch (error) {
        console.error("Error listing S3 buckets:", error);
        throw error;
    }
}

/**
 * Get the region where a bucket is located
 */
export async function getBucketRegion(bucketName: string): Promise<string> {
    try {
        const response = await s3Client.send(
            new GetBucketLocationCommand({ Bucket: bucketName })
        );
        // null or empty means us-east-1
        return response.LocationConstraint || "us-east-1";
    } catch (error) {
        console.error(`Error getting region for bucket ${bucketName}:`, error);
        return "unknown";
    }
}

/**
 * Check if bucket has encryption enabled
 */
export async function getBucketEncryption(bucketName: string): Promise<{
    enabled: boolean;
    type?: string;
}> {
    try {
        const response = await s3Client.send(
            new GetBucketEncryptionCommand({ Bucket: bucketName })
        );

        const rules = response.ServerSideEncryptionConfiguration?.Rules || [];
        if (rules.length > 0) {
            const encryptionType = rules[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
            return {
                enabled: true,
                type: encryptionType
            };
        }
        return { enabled: false };
    } catch (error: any) {
        // If encryption is not configured, AWS returns an error
        if (error.name === "ServerSideEncryptionConfigurationNotFoundError") {
            return { enabled: false };
        }
        console.error(`Error checking encryption for bucket ${bucketName}:`, error);
        return { enabled: false };
    }
}

/**
 * Check if bucket has versioning enabled
 */
export async function getBucketVersioning(bucketName: string): Promise<{
    enabled: boolean;
    mfaDelete: boolean;
}> {
    try {
        const response = await s3Client.send(
            new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        return {
            enabled: response.Status === "Enabled",
            mfaDelete: response.MFADelete === "Enabled"
        };
    } catch (error) {
        console.error(`Error checking versioning for bucket ${bucketName}:`, error);
        return { enabled: false, mfaDelete: false };
    }
}

/**
 * Check the public access block settings for a bucket
 */
export async function getPublicAccessBlock(bucketName: string): Promise<{
    blockPublicAcls: boolean;
    blockPublicPolicy: boolean;
    ignorePublicAcls: boolean;
    restrictPublicBuckets: boolean;
    isFullyBlocked: boolean;
}> {
    try {
        const response = await s3Client.send(
            new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );

        const config = response.PublicAccessBlockConfiguration;
        const blockPublicAcls = config?.BlockPublicAcls || false;
        const blockPublicPolicy = config?.BlockPublicPolicy || false;
        const ignorePublicAcls = config?.IgnorePublicAcls || false;
        const restrictPublicBuckets = config?.RestrictPublicBuckets || false;

        // Bucket is fully blocked if all four settings are true
        const isFullyBlocked = blockPublicAcls && blockPublicPolicy &&
            ignorePublicAcls && restrictPublicBuckets;

        return {
            blockPublicAcls,
            blockPublicPolicy,
            ignorePublicAcls,
            restrictPublicBuckets,
            isFullyBlocked
        };
    } catch (error: any) {
        // If public access block is not configured, it means public access might be allowed
        if (error.name === "NoSuchPublicAccessBlockConfiguration") {
            return {
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false,
                isFullyBlocked: false
            };
        }
        console.error(`Error checking public access for bucket ${bucketName}:`, error);
        return {
            blockPublicAcls: false,
            blockPublicPolicy: false,
            ignorePublicAcls: false,
            restrictPublicBuckets: false,
            isFullyBlocked: false
        };
    }
}

/**
 * Get complete information about all S3 buckets
 * This aggregates all the individual checks into one comprehensive result
 */
export async function getAllBucketsInfo(): Promise<S3BucketInfo[]> {
    const buckets = await listBuckets();
    console.log(buckets);
    const bucketsInfo: S3BucketInfo[] = [];

    for (const bucket of buckets) {
        if (!bucket.Name) continue;

        const bucketName = bucket.Name;

        // Fetch all details in parallel for better performance
        const [region, encryption, versioning, publicAccess] = await Promise.all([
            getBucketRegion(bucketName),
            getBucketEncryption(bucketName),
            getBucketVersioning(bucketName),
            getPublicAccessBlock(bucketName)
        ]);

        bucketsInfo.push({
            name: bucketName,
            region,
            creationDate: bucket.CreationDate,
            publicAccess,
            encryption,
            versioning
        });
    }

    return bucketsInfo;
}
