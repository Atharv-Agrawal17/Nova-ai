import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/* =========================================================
   NOVA CONFIGURATION
   ========================================================= */

const NOVA = {
    name: "NOVA",
    version: "2.0.0",

    model:
        process.env.OPENAI_MODEL || "gpt-5.6",

    maxMessages: 50,

    systemInstructions: `
You are NOVA, a highly capable general-purpose AI assistant.

Your goals:

1. Give useful, accurate and clear answers.
2. Explain difficult subjects simply when appropriate.
3. Help with programming and debugging.
4. Help with writing, brainstorming and learning.
5. Be honest when you are uncertain.
6. Never pretend that you performed an action you did not perform.
7. Follow safety requirements.
8. Adapt your explanation to the user's question.
9. Use structured answers when they improve readability.
10. Do not unnecessarily repeat the user's question.

You are the intelligence behind a project called NOVA AI.

Your personality should be:
- intelligent
- friendly
- calm
- helpful
- concise when a short answer is enough
- detailed when the user asks for detail

Do not claim to be the official ChatGPT product.
You are NOVA.
`
};


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

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.static(__dirname)
);


/* =========================================================
   OPENAI CLIENT
   ========================================================= */

let openai = null;

if (process.env.OPENAI_API_KEY) {

    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

}


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/status", (req, res) => {

    res.json({
        success: true,

        assistant: NOVA.name,

        version: NOVA.version,

        status:
            openai
                ? "online"
                : "configuration_required",

        model: NOVA.model,

        capabilities: [
            "conversation",
            "reasoning",
            "coding",
            "writing",
            "education",
            "analysis"
        ],

        timestamp:
            new Date().toISOString()
    });

});


/* =========================================================
   CHAT ENDPOINT
   ========================================================= */

app.post("/api/chat", async (req, res) => {

    try {

        /*
         * Make sure the AI provider is configured.
         */

        if (!openai) {

            return res.status(503).json({

                success: false,

                error:
                    "NOVA is not configured yet. Add OPENAI_API_KEY to your server environment."

            });

        }


        /*
         * Read messages from frontend.
         */

        const { messages } = req.body;


        /*
         * Validate messages.
         */

        if (!Array.isArray(messages)) {

            return res.status(400).json({

                success: false,

                error:
                    "The messages field must be an array."

            });

        }


        if (messages.length === 0) {

            return res.status(400).json({

                success: false,

                error:
                    "No messages were provided."

            });

        }


        /*
         * Prevent enormous requests.
         */

        const safeMessages =
            messages
                .slice(-NOVA.maxMessages)
                .filter(message => {

                    return (
                        message &&
                        typeof message.content === "string" &&
                        (
                            message.role === "user" ||
                            message.role === "assistant"
                        )
                    );

                })
                .map(message => ({

                    role: message.role,

                    content:
                        message.content.slice(0, 20000)

                }));


        if (safeMessages.length === 0) {

            return res.status(400).json({

                success: false,

                error:
                    "No valid messages were found."

            });

        }


        /*
         * Build the model input.
         */

        const input = [

            {
                role: "developer",

                content:
                    NOVA.systemInstructions
            },

            ...safeMessages

        ];


        /*
         * Ask the model for a response.
         */

        const response =
            await openai.responses.create({

                model: NOVA.model,

                input,

                store: false

            });


        /*
         * Extract generated text.
         */

        const output =
            response.output_text || "";


        if (!output.trim()) {

            return res.status(502).json({

                success: false,

                error:
                    "The AI model returned an empty response."

            });

        }


        /*
         * Send response to frontend.
         */

        return res.json({

            success: true,

            assistant: NOVA.name,

            model: NOVA.model,

            response: output,

            responseId:
                response.id || null

        });


    } catch (error) {

        console.error(
            "NOVA AI error:",
            error
        );


        /*
         * Friendly API errors.
         */

        const status =
            error?.status || 500;


        return res.status(status).json({

            success: false,

            error:
                getSafeErrorMessage(error)

        });

    }

});


/* =========================================================
   SAFE ERROR MESSAGE
   ========================================================= */

function getSafeErrorMessage(error) {

    if (!error) {

        return "Unknown NOVA server error.";

    }


    if (error.status === 401) {

        return "NOVA's AI credentials are invalid.";

    }


    if (error.status === 429) {

        return "NOVA has reached the current API usage limit. Please try again later.";

    }


    if (error.status >= 500) {

        return "The AI service is temporarily unavailable.";

    }


    return (
        error.message ||
        "NOVA encountered an unexpected error."
    );

}


/* =========================================================
   FRONTEND FALLBACK
   ========================================================= */

app.get("*", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


/* =========================================================
   START NOVA
   ========================================================= */

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "=========================================="
        );

        console.log(
            "              ✦ NOVA AI ✦"
        );

        console.log(
            "=========================================="
        );

        console.log(
            `Version: ${NOVA.version}`
        );

        console.log(
            `Model:   ${NOVA.model}`
        );

        console.log(
            `Server:  http://localhost:${PORT}`
        );

        console.log(
            `AI:      ${
                openai
                    ? "READY"
                    : "API KEY REQUIRED"
            }`
        );

        console.log(
            "=========================================="
        );

        console.log("");

    }
);
