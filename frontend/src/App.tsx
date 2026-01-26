import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { FindingsTable } from './components/FindingsTable';
import {
  triggerScan,
  getLatestResults,
  checkHealth
} from './services/api';
import type { ScanResult, SecurityFinding, ScanSummary } from './services/api';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract data from scan result
  const summary: ScanSummary | null = scanResult?.summary || null;
  const findings: SecurityFinding[] = scanResult?.findings || [];
  const lastScanTime = scanResult?.endTime || scanResult?.startTime;

  // Check backend connection
  const checkConnection = useCallback(async () => {
    const healthy = await checkHealth();
    setIsConnected(healthy);
    return healthy;
  }, []);

  // Fetch latest results
  const fetchResults = useCallback(async () => {
    try {
      const results = await getLatestResults();
      if (results) {
        setScanResult(results);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle scan button click
  const handleScan = async () => {
    setIsScanning(true);
    setError(null);

    try {
      const result = await triggerScan();
      setScanResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run scan';
      setError(errorMessage);
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      const connected = await checkConnection();
      if (connected) {
        await fetchResults();
      } else {
        setIsLoading(false);
      }
    };
    init();

    // Check connection periodically
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection, fetchResults]);

  return (
    <div className="app">
      <Header
        isScanning={isScanning}
        onScan={handleScan}
        lastScanTime={lastScanTime}
        isConnected={isConnected}
      />

      <main className="main-content">
        {/* Error message */}
        {error && (
          <div className="error-banner animate-fadeIn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Not connected warning */}
        {!isConnected && !isLoading && (
          <div className="warning-banner animate-fadeIn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Backend not connected. Make sure the server is running on <code>http://localhost:5000</code></span>
          </div>
        )}

        {/* Summary Cards */}
        <SummaryCards summary={summary} isLoading={isLoading} />

        {/* Findings Table */}
        <FindingsTable findings={findings} isLoading={isLoading} />
      </main>

      <footer className="footer">
        <p>
          Cloud Security Posture Management Dashboard •
          AWS Security Best Practices •
          <a href="https://www.cisecurity.org/benchmark/amazon_web_services" target="_blank" rel="noopener noreferrer">
            CIS AWS Foundations Benchmark
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
