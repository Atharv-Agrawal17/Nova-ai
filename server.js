import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(
    cors({
        origin: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"]
    })
);

app.use(express.json({ limit: "10mb" }));

app.use(express.static(__dirname));


/* =========================================================
   NOVA CONFIGURATION
   ========================================================= */

const NOVA_CONFIG = {
    name: "NOVA",
    version: "1.0.0",
    status: "online",

    capabilities: [
        "conversation",
        "reasoning",
        "coding",
        "writing",
        "education",
        "analysis"
    ]
};


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        assistant: NOVA_CONFIG.name,
        version: NOVA_CONFIG.version,
        status: NOVA_CONFIG.status,
        capabilities: NOVA_CONFIG.capabilities,
        timestamp: new Date().toISOString()
    });

});


/* =========================================================
   NOVA CHAT ENDPOINT
   ========================================================= */

app.post("/api/chat", async (req, res) => {

    try {

        const { messages } = req.body;

        if (!Array.isArray(messages)) {

            return res.status(400).json({
                success: false,
                error: "Messages must be an array."
            });

        }

        if (messages.length === 0) {

            return res.status(400).json({
                success: false,
                error: "No messages were provided."
            });

        }


        /*
         * SECURITY CHECK
         *
         * The API key belongs on the server,
         * NEVER inside index.html or app.js.
         */

        if (!process.env.AI_API_KEY) {

            return res.status(503).json({
                success: false,
                error:
                    "NOVA's AI provider has not been configured yet."
            });

        }


        /*
         * REAL AI PROVIDER CONNECTION
         *
         * This section will be connected in the next step.
         */

        return res.status(501).json({
            success: false,
            error:
                "NOVA backend is ready, but the AI model connection is the next setup step."
        });

    } catch (error) {

        console.error(
            "NOVA server error:",
            error
        );

        return res.status(500).json({
            success: false,
            error:
                "NOVA encountered a server error."
        });

    }

});


/* =========================================================
   SPA FALLBACK
   ========================================================= */

app.get("*", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(PORT, () => {

    console.log("");
    console.log("==================================");
    console.log("          NOVA AI ONLINE          ");
    console.log("==================================");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Status: ${NOVA_CONFIG.status}`);
    console.log("==================================");
    console.log("");

});
