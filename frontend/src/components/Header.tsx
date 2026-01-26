import './Header.css';

interface HeaderProps {
    isScanning: boolean;
    onScan: () => void;
    lastScanTime?: string;
    isConnected: boolean;
}

export function Header({ isScanning, onScan, lastScanTime, isConnected }: HeaderProps) {
    const formatTime = (timeString?: string) => {
        if (!timeString) return 'Never';
        const date = new Date(timeString);
        return date.toLocaleString();
    };

    return (
        <header className="header">
            <div className="header-left">
                <div className="logo">
                    <div className="logo-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                    </div>
                    <div className="logo-text">
                        <h1>CSPM Dashboard</h1>
                        <span className="logo-subtitle">AWS Cloud Security Posture</span>
                    </div>
                </div>
            </div>

            <div className="header-right">
                <div className="status-info">
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className="status-dot"></span>
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div className="last-scan">
                        <span className="label">Last Scan:</span>
                        <span className="time">{formatTime(lastScanTime)}</span>
                    </div>
                </div>

                <button
                    className="btn btn-primary scan-btn"
                    onClick={onScan}
                    disabled={isScanning || !isConnected}
                >
                    {isScanning ? (
                        <>
                            <span className="spinner"></span>
                            Scanning...
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                                <polyline points="21 3 21 9 15 9" />
                            </svg>
                            Run Scan
                        </>
                    )}
                </button>
            </div>
        </header>
    );
}
