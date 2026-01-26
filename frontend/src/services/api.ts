/**
 * API Service
 * Handles all communication with the CSPM backend
 */

const API_BASE_URL = 'http://localhost:5000/api';

// Severity levels for security findings
export const Severity = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    CRITICAL: "CRITICAL"
} as const;
export type Severity = typeof Severity[keyof typeof Severity];

// Status of each security check
export const CheckStatus = {
    PASS: "PASS",
    FAIL: "FAIL",
    ERROR: "ERROR"
} as const;
export type CheckStatus = typeof CheckStatus[keyof typeof CheckStatus];

// AWS Resource types we scan
export const ResourceType = {
    S3: "S3",
    EC2: "EC2",
    IAM: "IAM",
    RDS: "RDS",
    SECURITY_GROUP: "SECURITY_GROUP"
} as const;
export type ResourceType = typeof ResourceType[keyof typeof ResourceType];

export interface SecurityFinding {
    resourceType: ResourceType;
    resourceId: string;
    checkName: string;
    status: CheckStatus;
    severity: Severity;
    message: string;
    timestamp?: string;
    region?: string;
}

export interface ScanSummary {
    totalResources: number;
    passed: number;
    failed: number;
    errors: number;
    highSeverity: number;
    criticalSeverity: number;
    scanTime: string;
}

export interface ScanResult {
    id: string;
    summary: ScanSummary;
    findings: SecurityFinding[];
    startTime: string;
    endTime?: string;
    status: "running" | "completed" | "failed";
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

/**
 * Trigger a new security scan
 */
export async function triggerScan(): Promise<ScanResult> {
    const response = await fetch(`${API_BASE_URL}/scan`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const result: ApiResponse<ScanResult> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to trigger scan');
    }

    return result.data;
}

/**
 * Get the latest scan results
 */
export async function getLatestResults(): Promise<ScanResult | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/results`);
        const result: ApiResponse<ScanResult> = await response.json();

        if (!result.success) {
            return null;
        }

        return result.data || null;
    } catch (error) {
        console.error('Error fetching results:', error);
        return null;
    }
}

/**
 * Get scan summary
 */
export async function getSummary(): Promise<ScanSummary | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/summary`);
        const result: ApiResponse<ScanSummary> = await response.json();

        if (!result.success) {
            return null;
        }

        return result.data || null;
    } catch (error) {
        console.error('Error fetching summary:', error);
        return null;
    }
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const result = await response.json();
        return result.success === true;
    } catch (error) {
        return false;
    }
}
