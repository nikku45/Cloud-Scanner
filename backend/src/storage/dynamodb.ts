import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ScanResult, SecurityFinding } from "../types";

// Create DynamoDB client (uses AWS credentials from environment or CLI)
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "eu-north-1" });

// DynamoDB table name
const TABLE_NAME = "CloudPostureResults";
const GSI_NAME = "ScanHistoryIndex";



const prepareForStorage = (scanResult: ScanResult) => {

    const storageItem: any = {
        ...scanResult,
        startTime: scanResult.startTime instanceof Date ? scanResult.startTime.toISOString() : scanResult.startTime,
        endTime: scanResult.endTime instanceof Date ? scanResult.endTime.toISOString() : scanResult.endTime,
        summary: {
            ...scanResult.summary,
            scanTime: scanResult.summary.scanTime instanceof Date ? scanResult.summary.scanTime.toISOString() : scanResult.summary.scanTime
        },
        // We also need to process findings if they have dates
        findings: scanResult.findings.map(f => ({
            ...f,
            timestamp: f.timestamp instanceof Date ? f.timestamp.toISOString() : f.timestamp
        }))
    };
    //GSI keys
    storageItem.recordType = "SCAN";
    storageItem.createdAt = storageItem.startTime;

    // Add Sort Key (SK) required by User's Table Schema (PK=scanId, SK=resourceId)
    // Since this item represents the Scan Metadata, we use a constant value.
    storageItem.resourceId = "METADATA";

    return storageItem;
};

/**
 * Save a ScanResult to DynamoDB
 */
export const saveScanResult = async (scanResult: ScanResult) => {
    console.log("ScanResult getting saved to DynamoDB: ", scanResult.scanId);
    try {
        const item = prepareForStorage(scanResult);

        const params = {
            TableName: TABLE_NAME,
            Item: marshall(item, { removeUndefinedValues: true }),
        };

        await ddbClient.send(new PutItemCommand(params));
        console.log(`ScanResult saved to DynamoDB: ${scanResult.scanId}`);
    } catch (err) {
        console.error("Error saving ScanResult to DynamoDB:", err);
    }
};

/**
 * Get the latest ScanResult by querying the GSI
 */
export const getLatestScanResult = async (): Promise<ScanResult | null> => {
    try {
        const params = {
            TableName: TABLE_NAME,
            IndexName: GSI_NAME,
            KeyConditionExpression: "recordType = :pk",
            ExpressionAttributeValues: marshall({
                ":pk": "SCAN",
            }),
            ScanIndexForward: false, // Sort descending (newest first)
            Limit: 1,
        };

        const result = await ddbClient.send(new QueryCommand(params));

        if (!result.Items || result.Items.length === 0) {
            return null;
        }

        const scanResult = unmarshall(result.Items[0]) as ScanResult;
        return scanResult;
    } catch (err) {
        console.error("Error fetching latest ScanResult from DynamoDB:", err);
        return null;
    }
};

/**
 * Get a specific ScanResult by scanId
 */
export const getScanResult = async (scanId: string): Promise<ScanResult | null> => {
    try {
        const params = {
            TableName: TABLE_NAME,
            Key: marshall({
                scanId: scanId,
                resourceId: "METADATA" // Required Sort Key
            }),
        };

        const result = await ddbClient.send(new GetItemCommand(params));
        if (!result.Item) return null;

        const scanResult = unmarshall(result.Item) as ScanResult;
        return scanResult;
    } catch (err) {
        console.error("Error fetching ScanResult from DynamoDB:", err);
        return null;
    }
};
