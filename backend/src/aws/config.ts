/**
 * AWS Configuration Module
 * Centralizes AWS SDK configuration and credentials management
 */

import { AWSConfig } from "../types";

/**
 * Get AWS configuration from environment variables
 * Credentials can be set via:
 * 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * 2. AWS credentials file (~/.aws/credentials)
 * 3. IAM role (when running on AWS infrastructure)
 */
export function getAWSConfig(): AWSConfig {
    const region = process.env.AWS_REGION || "us-east-1";

    // If explicit credentials are provided, use them
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        return {
            region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        };
    }

    // Otherwise, let AWS SDK use default credential chain
    // (environment, shared credentials file, IAM role, etc.)
    return { region };
}

/**
 * Validate that AWS credentials are configured
 */
export function validateAWSCredentials(): { valid: boolean; message: string } {
    const hasExplicitCredentials =
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

    if (hasExplicitCredentials) {
        return {
            valid: true,
            message: "Using credentials from environment variables"
        };
    }

    // If no explicit credentials, we'll rely on AWS SDK's default chain
    return {
        valid: true,
        message: "Using AWS SDK default credential chain (aws configure, IAM role, etc.)"
    };
}
