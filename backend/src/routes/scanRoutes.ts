/**
 * Scan Routes
 * Express router for security scanning API endpoints
 */

import { Router, Request, Response } from "express";
import {
    runFullScan,
    getLatestScan,
    getLatestSummary,
} from "../services/scanService";

const router = Router();

/**
 * POST /api/scan
 * Trigger a new security scan
 */
router.post("/scan", async (req: Request, res: Response) => {
    try {
        console.log("Received scan request...");

        // Run the full scan (this may take a while)
        const result = await runFullScan();

        res.status(200).json({
            success: true,
            message: "Scan completed successfully",
            data: result
        });
    } catch (error) {
        console.error("Scan API error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to run security scan",
            error: String(error)
        });
    }
});

/**
 * GET /api/results
 * Get the latest scan results
 */
router.get("/results", async (req: Request, res: Response) => {
    try {
        const result = await getLatestScan();

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "No scan results found. Run a scan first."
            });
        }

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Results API error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get scan results",
            error: String(error)
        });
    }
});

/**
 * GET /api/results/:scanId
 * Get results for a specific scan
 */
// router.get("/results/:scanId", (req: Request, res: Response) => {
//     try {
//         const { scanId } = req.params;
//         const result = getScanById(scanId);

//         if (!result) {
//             return res.status(404).json({
//                 success: false,
//                 message: `Scan ${scanId} not found`
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: result
//         });
//     } catch (error) {
//         console.error("Results API error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get scan results",
//             error: String(error)
//         });
//     }
// });

/**
 * GET /api/summary
 * Get summary of the latest scan
 */
// router.get("/summary", async (req: Request, res: Response) => {
//     try {
//         const summary = await getLatestSummary();

//         if (!summary) {
//             return res.status(404).json({
//                 success: false,
//                 message: "No scan summary found. Run a scan first."
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: summary
//         });
//     } catch (error) {
//         console.error("Summary API error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get scan summary",
//             error: String(error)
//         });
//     }
// });

/**
 * GET /api/history
 * Get scan history
 */
// router.get("/history", (req: Request, res: Response) => {
//     try {
//         const history = getScanHistory();

//         // Return simplified history (without full findings for performance)
//         const simplifiedHistory = history.map(scan => ({
//             scanId: scan.scanId,
//             summary: scan.summary,
//             startTime: scan.startTime,
//             endTime: scan.endTime,
//             status: scan.status,
//             findingsCount: scan.findings.length
//         }));

//         res.status(200).json({
//             success: true,
//             data: simplifiedHistory
//         });
//     } catch (error) {
//         console.error("History API error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get scan history",
//             error: String(error)
//         });
//     }
// });

/**
 * GET /api/health
 * Health check endpoint
 */
router.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "CSPM Backend is running",
        timestamp: new Date().toISOString()
    });
});

export default router;
