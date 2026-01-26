import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import scanRoutes from "./routes/scanRoutes";


const app: Application = express();



// Enable CORS for frontend access
app.use(cors({
    origin: ["http://localhost:5173", "https://cloud-scanner.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
}));


app.use(express.json());


app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ===================
// Routes
// ===================

// API routes
app.use("/api", scanRoutes);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
    res.json({
        name: "CSPM Backend API",
        version: "1.0.0",
        description: "Cloud Security Posture Management for AWS",
        endpoints: {
            health: "GET /api/health",
            triggerScan: "POST /api/scan",
            getResults: "GET /api/results",
            getSummary: "GET /api/summary",
            getHistory: "GET /api/history"
        }
    });
});

// ===================
// Error Handling
// ===================

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.path}`
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

export default app;
