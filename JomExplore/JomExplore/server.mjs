import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const ollamaModel = process.env.JOMEXPLORE_OLLAMA_MODEL || "gemma3:4b";

// Deployed hosts (Render, Railway, etc.) cannot reach a laptop's local Ollama
// instance, so when a GROQ_API_KEY is present we use Groq's free hosted API
// instead. Local development with `ollama pull` + `ollama serve` still works
// unchanged when no key is set.
const groqApiKey = process.env.GROQ_API_KEY || "";
const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const aiProvider = groqApiKey ? "groq" : "ollama";

// Mini-survey storage. NOTE: on Render's free tier the filesystem is
// ephemeral — it can be wiped when the instance restarts or spins down
// after idling. Every response is also printed to the console (visible in
// Render's Logs tab) as a backup, in case the file doesn't survive between
// test sessions.
const surveyDataDir = path.join(rootDirectory, "data");
const surveyFilePath = path.join(surveyDataDir, "survey-responses.jsonl");

async function appendSurveyResponse(entry) {
    await fs.mkdir(surveyDataDir, { recursive: true });
    await fs.appendFile(surveyFilePath, `${JSON.stringify(entry)}\n`, "utf8");
}

async function readSurveyResponses() {
    try {
        const raw = await fs.readFile(surveyFilePath, "utf8");
        return raw.split("\n").filter(Boolean).map(line => JSON.parse(line));
    }
    catch {
        return [];
    }
}

const interpretationSchema = {
    type: "object",
    properties: {
        availableHours: { type: ["integer", "null"], enum: [3, 5, 8, 10, null] },
        maximumBudget: { type: ["integer", "null"], enum: [0, 50, 100, 200, 300, null] },
        transport: { type: ["string", "null"], enum: ["auto", "transit", "walking", "driving", "bicycling", null] },
        startTime: { type: ["string", "null"] },
        preferredCategories: {
            type: "array",
            items: { enum: ["Food", "Culture", "Nature", "Shopping", "Entertainment", "Adventure", "Activities"] }
        },
        pace: { enum: ["standard", "relaxed", "packed"] },
        summaries: { type: "array", items: { type: "string" } }
    },
    required: ["availableHours", "maximumBudget", "transport", "startTime", "preferredCategories", "pace", "summaries"]
};

const explanationSchema = {
    type: "object",
    properties: { summary: { type: "string" } },
    required: ["summary"]
};

function sendJson(response, status, payload) {
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(payload));
}

async function readJson(request) {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
        size += chunk.length;
        if (size > 1_000_000) throw new Error("Request is too large.");
        chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function callOllama(messages, format) {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: ollamaModel,
            messages,
            format,
            stream: false,
            think: false,
            options: { temperature: 0.1 }
        }),
        signal: AbortSignal.timeout(60_000)
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Ollama returned ${response.status}: ${detail.slice(0, 240)}`);
    }

    const result = await response.json();
    return {
        content: JSON.parse(result.message.content),
        usage: {
            promptTokens: result.prompt_eval_count || 0,
            outputTokens: result.eval_count || 0,
            totalDurationMs: Math.round((result.total_duration || 0) / 1_000_000)
        }
    };
}

// Groq's API is OpenAI-compatible: no strict JSON-schema enforcement like
// Ollama's `format` param, only a general "always return valid JSON" mode.
// We compensate by describing the required shape in the system prompt; the
// existing normalizeInterpretation()/summary handling already tolerates
// missing or malformed fields defensively.
async function callGroq(messages, jsonShapeDescription) {
    const augmentedMessages = [
        { role: "system", content: `Respond only with a single valid JSON object. ${jsonShapeDescription}` },
        ...messages
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
            model: groqModel,
            messages: augmentedMessages,
            response_format: { type: "json_object" },
            temperature: 0.1
        }),
        signal: AbortSignal.timeout(60_000)
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Groq returned ${response.status}: ${detail.slice(0, 240)}`);
    }

    const result = await response.json();
    const usage = result.usage || {};
    return {
        content: JSON.parse(result.choices[0].message.content),
        usage: {
            promptTokens: usage.prompt_tokens || 0,
            outputTokens: usage.completion_tokens || 0,
            totalDurationMs: Math.round((usage.total_time || 0) * 1000)
        }
    };
}

// Single entry point used by both handlers below. `schema` is the JSON
// Schema object (used verbatim by Ollama's structured-output mode);
// `jsonShapeDescription` is the same shape restated in prose, used only
// when calling Groq.
async function callAI(messages, schema, jsonShapeDescription) {
    if (aiProvider === "groq") {
        return callGroq(messages, jsonShapeDescription);
    }
    return callOllama(messages, schema);
}

function normalizeInterpretation(value) {
    const updates = {};
    for (const key of ["availableHours", "maximumBudget", "transport", "startTime"]) {
        if (value[key] !== null && value[key] !== undefined) updates[key] = value[key];
    }
    if (updates.startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(updates.startTime)) {
        delete updates.startTime;
    }
    return {
        updates,
        preferredCategories: Array.isArray(value.preferredCategories)
            ? [...new Set(value.preferredCategories)]
            : [],
        pace: ["standard", "relaxed", "packed"].includes(value.pace)
            ? value.pace
            : "standard",
        summaries: Array.isArray(value.summaries)
            ? value.summaries.slice(0, 8).map(String)
            : []
    };
}

async function handleInterpret(request, response) {
    const body = await readJson(request);
    if (typeof body.request !== "string" || !body.request.trim()) {
        sendJson(response, 400, { error: "A planner request is required." });
        return;
    }

    const prompt = `Interpret this Kuala Lumpur itinerary request: ${JSON.stringify(body.request.trim())}\n\n` +
        `Return only values supported by the schema. For a maximum budget between options, choose the largest option that does not exceed the user's maximum. ` +
        `Use null when the user did not specify a field. Do not invent a preference. Summaries must be brief, factual descriptions of what you extracted.`;
    const shapeDescription = `JSON shape: {"availableHours": 3|5|8|10|null, "maximumBudget": 0|50|100|200|300|null, ` +
        `"transport": "auto"|"transit"|"walking"|"driving"|"bicycling"|null, "startTime": "HH:MM"|null, ` +
        `"preferredCategories": array of any of ["Food","Culture","Nature","Shopping","Entertainment","Adventure","Activities"], ` +
        `"pace": "standard"|"relaxed"|"packed", "summaries": array of short strings}`;
    const result = await callAI([
        {
            role: "system",
            content: "You extract travel-planning constraints. Never recommend places, prices, opening hours, routes, or facts. Only structure the user's stated intent."
        },
        { role: "user", content: prompt }
    ], interpretationSchema, shapeDescription);

    sendJson(response, 200, {
        provider: aiProvider,
        model: aiProvider === "groq" ? groqModel : ollamaModel,
        interpretation: normalizeInterpretation(result.content),
        usage: result.usage
    });
}

async function handleExplain(request, response) {
    const body = await readJson(request);
    const itinerary = body.itinerary;
    if (!itinerary?.scheduled?.length) {
        sendJson(response, 400, { error: "A generated itinerary is required." });
        return;
    }

    const groundedPlan = {
        date: itinerary.settings?.date,
        startTime: itinerary.settings?.startTime,
        availableHours: itinerary.settings?.availableHours,
        pace: itinerary.settings?.pace,
        maximumBudget: itinerary.settings?.maximumBudget,
        stops: itinerary.scheduled.slice(0, 12).map(item => ({
            name: item.place?.name,
            category: item.place?.category,
            area: item.place?.area,
            arrival: item.arrival,
            departure: item.departure,
            estimatedPrice: item.place?.price,
            transport: item.transportMode,
            travelMinutes: item.travelMinutes,
            distanceKm: Number(item.distance?.toFixed?.(1) || 0),
            breakAfter: item.breakAfter || null
        })),
        excluded: (itinerary.skipped || []).map(place => place.name)
    };

    const shapeDescription = `JSON shape: {"summary": "2 to 4 concise sentences as a single string"}`;
    const result = await callAI([
        {
            role: "system",
            content: "Explain a generated itinerary using only the supplied JSON. Write 2 to 4 concise sentences. Mention why the order or transport is sensible and any excluded stops. Never claim live traffic, operating hours, reservations, accessibility, or factual venue status. Clearly call travel time and cost estimates."
        },
        { role: "user", content: JSON.stringify(groundedPlan) }
    ], explanationSchema, shapeDescription);

    sendJson(response, 200, {
        provider: aiProvider,
        model: aiProvider === "groq" ? groqModel : ollamaModel,
        explanation: String(result.content.summary || "").trim(),
        usage: result.usage
    });
}

async function handleSurveySubmit(request, response) {
    const body = await readJson(request);
    if (typeof body.helpful !== "boolean") {
        sendJson(response, 400, { error: "'helpful' (true/false) is required." });
        return;
    }

    const entry = {
        timestamp: new Date().toISOString(),
        helpful: body.helpful,
        comment: typeof body.comment === "string" ? body.comment.slice(0, 500) : "",
        sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : "unknown",
        placeCount: Number.isFinite(body.placeCount) ? body.placeCount : null
    };

    console.log(`SURVEY_RESPONSE: ${JSON.stringify(entry)}`);

    try {
        await appendSurveyResponse(entry);
    }
    catch (error) {
        // Still count it as received even if the write fails — it's already
        // in the console logs above.
        console.error("Could not write survey response to disk:", error.message);
    }

    sendJson(response, 200, { ok: true });
}

async function handleSurveyResults(request, response) {
    const responses = await readSurveyResponses();
    sendJson(response, 200, { count: responses.length, responses });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function handleSurveyView(request, response) {
    const responses = (await readSurveyResponses()).slice().reverse();
    const yesCount = responses.filter(entry => entry.helpful).length;
    const noCount = responses.length - yesCount;

    const rows = responses.map(entry => `
        <tr>
            <td>${escapeHtml(new Date(entry.timestamp).toLocaleString())}</td>
            <td class="${entry.helpful ? "yes" : "no"}">${entry.helpful ? "👍 Yes" : "👎 No"}</td>
            <td>${entry.placeCount ?? "—"}</td>
            <td>${escapeHtml(entry.sessionId).slice(0, 12)}…</td>
            <td>${escapeHtml(entry.comment || "—")}</td>
        </tr>`).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Survey Results | JomExplore</title>
<style>
    body { font-family: Arial, sans-serif; background: #f6fbf9; color: #1f2937; margin: 0; padding: 32px 24px; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    .summary { display: flex; gap: 16px; margin: 18px 0 26px; flex-wrap: wrap; }
    .summary div { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 14px 18px; min-width: 110px; }
    .summary strong { display: block; font-size: 22px; }
    .summary span { color: #64748b; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    th { background: #ecfdf5; color: #0f766e; text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; }
    td.yes { color: #0f766e; font-weight: 700; }
    td.no { color: #9a3412; font-weight: 700; }
    .empty { color: #64748b; padding: 24px 0; }
    .refresh-note { color: #64748b; font-size: 12px; margin-top: 20px; }
</style>
</head>
<body>
    <h1>JomExplore — Itinerary Survey Results</h1>
    <div class="summary">
        <div><strong>${responses.length}</strong><span>Total responses</span></div>
        <div><strong>${yesCount}</strong><span>👍 Helpful</span></div>
        <div><strong>${noCount}</strong><span>👎 Not helpful</span></div>
    </div>
    ${responses.length
        ? `<table>
            <thead><tr><th>Time</th><th>Helpful?</th><th># Places</th><th>Session</th><th>Comment</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`
        : `<p class="empty">No responses yet.</p>`}
    <p class="refresh-note">Reload this page to see new responses as they come in.</p>
</body>
</html>`;

    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
}

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp"
};

async function serveStatic(request, response) {
    const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relativePath = requestPath === "/" ? "Index.html" : requestPath.replace(/^\/+/, "");
    const filePath = path.resolve(rootDirectory, relativePath);
    if (!filePath.startsWith(`${rootDirectory}${path.sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
    }

    try {
        const content = await fs.readFile(filePath);
        response.writeHead(200, {
            "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
            "Cache-Control": "no-cache"
        });
        response.end(content);
    }
    catch {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
    }
}

const server = http.createServer(async (request, response) => {
    try {
        const pathname = new URL(request.url, "http://localhost").pathname;
        if (request.method === "GET" && pathname === "/api/ai/status") {
            try {
                if (aiProvider === "groq") {
                    const statusResponse = await fetch("https://api.groq.com/openai/v1/models", {
                        headers: { "Authorization": `Bearer ${groqApiKey}` },
                        signal: AbortSignal.timeout(2_500)
                    });
                    sendJson(response, 200, {
                        available: statusResponse.ok,
                        provider: "groq",
                        model: groqModel
                    });
                }
                else {
                    const statusResponse = await fetch(`${ollamaUrl}/api/tags`, {
                        signal: AbortSignal.timeout(2_500)
                    });
                    sendJson(response, 200, {
                        available: statusResponse.ok,
                        provider: "ollama",
                        model: ollamaModel
                    });
                }
            }
            catch {
                sendJson(response, 200, { available: false, provider: "fallback", model: null });
            }
            return;
        }
        if (request.method === "POST" && pathname === "/api/ai/interpret") {
            await handleInterpret(request, response);
            return;
        }
        if (request.method === "POST" && pathname === "/api/ai/explain") {
            await handleExplain(request, response);
            return;
        }
        if (request.method === "POST" && pathname === "/api/survey") {
            await handleSurveySubmit(request, response);
            return;
        }
        if (request.method === "GET" && pathname === "/api/survey") {
            await handleSurveyResults(request, response);
            return;
        }
        if (request.method === "GET" && pathname === "/survey") {
            await handleSurveyView(request, response);
            return;
        }
        if (request.method === "GET" || request.method === "HEAD") {
            await serveStatic(request, response);
            return;
        }
        sendJson(response, 405, { error: "Method not allowed." });
    }
    catch (error) {
        sendJson(response, 503, {
            error: "Local AI is unavailable.",
            detail: error.message,
            fallbackAvailable: true
        });
    }
});

server.listen(port, "0.0.0.0", () => {
    console.log(`JomExplore running on port ${port}`);
    console.log(aiProvider === "groq"
        ? `AI provider: Groq (${groqModel})`
        : `AI provider: Ollama ${ollamaModel} at ${ollamaUrl}`);
});
