# CSPM Dashboard - AWS Cloud Security Posture Management

A full-stack Cloud Security Posture Management (CSPM) dashboard that scans AWS accounts for security misconfigurations and displays findings in a beautiful, interactive UI.

![Dashboard Preview](docs/dashboard-preview.png)

## 🎯 Features

### Security Checks Implemented

| Service | Check | Severity |
|---------|-------|----------|
| **S3** | Public Access Block | HIGH |
| **S3** | Server-Side Encryption | MEDIUM |
| **S3** | Versioning Enabled | LOW |
| **EC2** | SSH Port 22 Exposure (0.0.0.0/0) | HIGH |
| **EC2** | RDP Port 3389 Exposure (0.0.0.0/0) | HIGH |
| **EC2** | Unrestricted Inbound Access | MEDIUM |
| **EC2** | Public IP Exposure | MEDIUM |
| **IAM** | Root Account MFA | CRITICAL |
| **IAM** | User MFA (console access) | HIGH |
| **IAM** | Admin Access Detection | HIGH |
| **RDS** | Public Accessibility | HIGH |
| **RDS** | Encryption at Rest | MEDIUM |
| **RDS** | Automated Backups | MEDIUM |
| **RDS** | Multi-AZ Deployment | LOW |

### Dashboard Features

- ✅ Real-time security scanning
- ✅ Summary cards with pass/fail metrics
- ✅ Filterable findings table (by severity, service, status)
- ✅ Beautiful dark theme UI
- ✅ Responsive design
- ✅ Connection status indicator

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React         │     │   Express       │     │   AWS APIs      │
│   Frontend      │────▶│   Backend       │────▶│   (S3, EC2,     │
│   (Dashboard)   │     │   (REST API)    │     │   IAM, RDS)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     :5173                   :5000
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- AWS CLI configured with credentials (`aws configure`)
- Read-only IAM permissions (see below)

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (optional, if not using aws configure):
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
PORT=5000
```

Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Access the Dashboard

Open http://localhost:5173 in your browser.

Click "Run Scan" to trigger a security scan!

## 🔐 AWS Permissions Required

Create an IAM user/role with these **read-only** permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation",
                "s3:GetBucketEncryption",
                "s3:GetBucketVersioning",
                "s3:GetBucketPublicAccessBlock",
                "ec2:DescribeInstances",
                "ec2:DescribeSecurityGroups",
                "iam:ListUsers",
                "iam:ListMFADevices",
                "iam:GetLoginProfile",
                "iam:ListAttachedUserPolicies",
                "iam:ListUserPolicies",
                "iam:GetAccountSummary",
                "rds:DescribeDBInstances"
            ],
            "Resource": "*"
        }
    ]
}
```

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── aws/           # AWS SDK clients
│   │   │   ├── config.ts  # AWS configuration
│   │   │   ├── s3.ts      # S3 operations
│   │   │   ├── ec2.ts     # EC2 operations
│   │   │   ├── iam.ts     # IAM operations
│   │   │   └── rds.ts     # RDS operations
│   │   ├── scanners/      # Security scanners
│   │   │   ├── s3Scanner.ts
│   │   │   ├── ec2Scanner.ts
│   │   │   ├── iamScanner.ts
│   │   │   └── rdsScanner.ts
│   │   ├── rules/         # Security rules
│   │   │   └── cisRules.ts
│   │   ├── services/      # Business logic
│   │   │   └── scanService.ts
│   │   ├── routes/        # API routes
│   │   │   └── scanRoutes.ts
│   │   ├── types/         # TypeScript types
│   │   │   └── index.ts
│   │   ├── app.ts         # Express app
│   │   └── server.ts      # Server entry
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Header.tsx
│   │   │   ├── SummaryCards.tsx
│   │   │   └── FindingsTable.tsx
│   │   ├── services/      # API client
│   │   │   └── api.ts
│   │   ├── App.tsx        # Main app
│   │   └── index.css      # Global styles
│   └── package.json
│
└── README.md
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/scan` | Trigger security scan |
| GET | `/api/results` | Get latest scan results |
| GET | `/api/summary` | Get scan summary |
| GET | `/api/history` | Get scan history |

### Sample Response

```json
{
  "success": true,
  "data": {
    "id": "scan-1706200000-abc123",
    "summary": {
      "totalResources": 15,
      "passed": 10,
      "failed": 5,
      "highSeverity": 2
    },
    "findings": [
      {
        "resourceType": "S3",
        "resourceId": "my-bucket",
        "checkName": "Public Access Block",
        "status": "FAIL",
        "severity": "HIGH",
        "message": "Public access is NOT fully blocked"
      }
    ]
  }
}
```


## 📚 Based On

- [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)

## 🛠️ Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- AWS SDK v3

**Frontend:**
- React 18
- TypeScript
- Vite
- Vanilla CSS

## 📄 License

MIT License - Feel free to use for learning and interviews!

---

Built with ❤️ for cloud security learning
