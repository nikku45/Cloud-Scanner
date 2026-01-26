import { useState } from 'react';
import { Severity, ResourceType, CheckStatus } from '../services/api';
import type { SecurityFinding } from '../services/api';
import './FindingsTable.css';

interface FindingsTableProps {
    findings: SecurityFinding[];
    isLoading: boolean;
}

type SeverityFilter = 'ALL' | Severity;
type ServiceFilter = 'ALL' | ResourceType;
type StatusFilter = 'ALL' | CheckStatus;

export function FindingsTable({ findings, isLoading }: FindingsTableProps) {
    const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
    const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

    // Filter findings
    const filteredFindings = findings.filter(finding => {
        if (severityFilter !== 'ALL' && finding.severity !== severityFilter) return false;
        if (serviceFilter !== 'ALL' && finding.resourceType !== serviceFilter) return false;
        if (statusFilter !== 'ALL' && finding.status !== statusFilter) return false;
        return true;
    });

    // Sort by severity (critical first) then by status (fail first)
    const sortedFindings = [...filteredFindings].sort((a, b) => {
        const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        const statusOrder: Record<string, number> = { FAIL: 0, ERROR: 1, PASS: 2 };

        if (a.status !== b.status) {
            return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
        }
        return (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
    });

    if (isLoading) {
        return (
            <div className="findings-section">
                <div className="findings-header">
                    <h2>Security Findings</h2>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading findings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="findings-section">
            <div className="findings-header">
                <h2>Security Findings</h2>
                <span className="findings-count">{sortedFindings.length} of {findings.length} results</span>
            </div>

            {/* Filters */}
            <div className="filters">
                <div className="filter-group">
                    <span className="filter-label">Status:</span>
                    <button
                        className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('ALL')}
                    >All</button>
                    <button
                        className={`filter-btn fail ${statusFilter === CheckStatus.FAIL ? 'active' : ''}`}
                        onClick={() => setStatusFilter(CheckStatus.FAIL)}
                    >Failed</button>
                    <button
                        className={`filter-btn pass ${statusFilter === CheckStatus.PASS ? 'active' : ''}`}
                        onClick={() => setStatusFilter(CheckStatus.PASS)}
                    >Passed</button>
                </div>

                <div className="filter-group">
                    <span className="filter-label">Severity:</span>
                    <button
                        className={`filter-btn ${severityFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setSeverityFilter('ALL')}
                    >All</button>
                    <button
                        className={`filter-btn critical ${severityFilter === Severity.CRITICAL ? 'active' : ''}`}
                        onClick={() => setSeverityFilter(Severity.CRITICAL)}
                    >Critical</button>
                    <button
                        className={`filter-btn high ${severityFilter === Severity.HIGH ? 'active' : ''}`}
                        onClick={() => setSeverityFilter(Severity.HIGH)}
                    >High</button>
                    <button
                        className={`filter-btn medium ${severityFilter === Severity.MEDIUM ? 'active' : ''}`}
                        onClick={() => setSeverityFilter(Severity.MEDIUM)}
                    >Medium</button>
                    <button
                        className={`filter-btn low ${severityFilter === Severity.LOW ? 'active' : ''}`}
                        onClick={() => setSeverityFilter(Severity.LOW)}
                    >Low</button>
                </div>

                <div className="filter-group">
                    <span className="filter-label">Service:</span>
                    <button
                        className={`filter-btn ${serviceFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setServiceFilter('ALL')}
                    >All</button>
                    <button
                        className={`filter-btn s3 ${serviceFilter === ResourceType.S3 ? 'active' : ''}`}
                        onClick={() => setServiceFilter(ResourceType.S3)}
                    >S3</button>
                    <button
                        className={`filter-btn ec2 ${serviceFilter === ResourceType.EC2 ? 'active' : ''}`}
                        onClick={() => setServiceFilter(ResourceType.EC2)}
                    >EC2</button>
                    <button
                        className={`filter-btn iam ${serviceFilter === ResourceType.IAM ? 'active' : ''}`}
                        onClick={() => setServiceFilter(ResourceType.IAM)}
                    >IAM</button>
                    <button
                        className={`filter-btn rds ${serviceFilter === ResourceType.RDS ? 'active' : ''}`}
                        onClick={() => setServiceFilter(ResourceType.RDS)}
                    >RDS</button>
                </div>
            </div>

            {/* Table */}
            {sortedFindings.length === 0 ? (
                <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                    <p>No findings match your filters</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Resource</th>
                                <th>Check</th>
                                <th>Status</th>
                                <th>Severity</th>
                                <th>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedFindings.map((finding, index) => (
                                <tr key={`${finding.resourceId}-${finding.checkName}-${index}`} className={`row-${finding.status.toLowerCase()}`}>
                                    <td>
                                        <span className={`badge badge-${finding.resourceType.toLowerCase()}`}>
                                            {finding.resourceType}
                                        </span>
                                    </td>
                                    <td className="resource-cell">
                                        <span className="resource-id" title={finding.resourceId}>
                                            {finding.resourceId}
                                        </span>
                                        {finding.region && (
                                            <span className="resource-region">{finding.region}</span>
                                        )}
                                    </td>
                                    <td className="check-name">{finding.checkName}</td>
                                    <td>
                                        <span className={`badge badge-${finding.status.toLowerCase()}`}>
                                            {finding.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${finding.severity.toLowerCase()}`}>
                                            {finding.severity}
                                        </span>
                                    </td>
                                    <td className="message-cell">{finding.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
