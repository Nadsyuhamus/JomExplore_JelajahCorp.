# JomExplore local AI setup

JomExplore uses a hybrid architecture:

- Ollama interprets natural-language planner requests.
- The deterministic JavaScript engine handles distance, time, budget, transport and ordering.
- Ollama explains the completed plan using only the itinerary data supplied by the engine.
- The existing rule-based parser remains available as an explicitly labelled fallback.

## 1. Install and start Ollama

Install Ollama for macOS, Windows or Linux, then pull the default model:

```bash
ollama pull gemma3:4b
```

Ollama normally runs its local API automatically at `http://127.0.0.1:11434`.

## 2. Start JomExplore

From this directory:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Do not open the HTML files directly if you want the real AI features. Direct/static hosting still supports the rule-based fallback.

## Configuration

Use another installed model:

```bash
JOMEXPLORE_OLLAMA_MODEL=qwen3:4b npm start
```

Use another Ollama address:

```bash
OLLAMA_URL=http://127.0.0.1:11434 npm start
```

Use another JomExplore port:

```bash
PORT=8080 npm start
```

## Demonstration prompts

- `Plan a relaxed cultural half-day under RM100 with less walking.`
- `I want food and shopping, start in the afternoon, and use public transport.`
- `Make an 8-hour packed plan and automatically choose transport.`

The assistant should display `Local AI · gemma3:4b` when Ollama is connected. Otherwise it displays `Prototype fallback`.

## Grounding and safety

The model is instructed not to invent places, prices, opening hours or routes. Its structured output is restricted to values supported by the planner form. The explanation endpoint receives only the generated itinerary and must describe that supplied data. Travel times, prices and schedule guidance remain estimates.
