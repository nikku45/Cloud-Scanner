import {
    S3Client,
    ListBucketsCommand,
    GetBucketLocationCommand,
    GetBucketEncryptionCommand,
} from "@aws-sdk/client-s3";

// Create S3 client
// AWS credentials are automatically picked from aws configure
const s3Client = new S3Client({});

async function listS3Buckets() {
    try {
        // 1. Get list of all buckets
        const bucketsResponse = await s3Client.send(
            new ListBucketsCommand({})
        );

        const buckets = bucketsResponse.Buckets || [];

        console.log(`Found ${buckets.length} S3 buckets\n`);

        // 2. Loop through each bucket
        for (const bucket of buckets) {
            const bucketName = bucket.Name!;
            let region = "unknown";
            let encryptionEnabled = false;

            // 3. Get bucket region
            try {
                const locationResponse = await s3Client.send(
                    new GetBucketLocationCommand({ Bucket: bucketName })
                );

                region = locationResponse.LocationConstraint || "us-east-1";
            } catch (err) {
                console.log(`Could not get region for ${bucketName}`);
            }

            // 4. Check encryption
            try {
                await s3Client.send(
                    new GetBucketEncryptionCommand({ Bucket: bucketName })
                );
                encryptionEnabled = true;
            } catch (err) {
                encryptionEnabled = false;
            }

            // 5. Print result
            console.log("Bucket Name:", bucketName);
            console.log("Region:", region);
            console.log("Encryption Enabled:", encryptionEnabled ? "YES" : "NO");
            console.log("-----------------------------------");
        }
    } catch (error) {
        console.error("Error listing S3 buckets:", error);
    }
}

// Run the function
listS3Buckets();
