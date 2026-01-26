import type { ScanSummary } from '../services/api';
import './SummaryCards.css';

interface SummaryCardsProps {
    summary: ScanSummary | null;
    isLoading: boolean;
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
    if (isLoading) {
        return (
            <div className="summary-cards">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="summary-card skeleton">
                        <div className="skeleton-text"></div>
                        <div className="skeleton-number"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="summary-cards">
                <div className="summary-card empty">
                    <p>No scan data available. Run a scan to see results.</p>
                </div>
            </div>
        );
    }

    const passRate = summary.totalResources > 0
        ? Math.round((summary.passed / summary.totalResources) * 100)
        : 0;

    return (
        <div className="summary-cards">
            {/* Total Resources */}
            <div className="summary-card">
                <div className="card-icon total">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                </div>
                <div className="card-content">
                    <span className="card-label">Total Checks</span>
                    <span className="card-value">{summary.totalResources}</span>
                </div>
            </div>

            {/* Passed */}
            <div className="summary-card pass">
                <div className="card-icon pass">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                </div>
                <div className="card-content">
                    <span className="card-label">Passed</span>
                    <span className="card-value pass">{summary.passed}</span>
                    <div className="progress-bar">
                        <div className="progress-fill pass" style={{ width: `${passRate}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Failed */}
            <div className="summary-card fail">
                <div className="card-icon fail">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </div>
                <div className="card-content">
                    <span className="card-label">Failed</span>
                    <span className="card-value fail">{summary.failed}</span>
                    <div className="progress-bar">
                        <div className="progress-fill fail" style={{ width: `${100 - passRate}%` }}></div>
                    </div>
                </div>
            </div>

            {/* High Risk */}
            <div className="summary-card critical">
                <div className="card-icon critical">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
                <div className="card-content">
                    <span className="card-label">High Risk</span>
                    <span className="card-value critical">
                        {summary.highSeverity + summary.criticalSeverity}
                    </span>
                    {summary.criticalSeverity > 0 && (
                        <span className="critical-warning">
                            {summary.criticalSeverity} Critical!
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
