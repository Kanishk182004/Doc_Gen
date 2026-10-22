# 9-Minute Live Coding & Demo Script

**Role:** Senior Python AI Engineer & Autonomous Agent Architect  
**Project:** Autonomous Document Agent — Plan, Execute, Review, Deliver  
**Target Duration:** 8 to 10 minutes (target 9 minutes)

---

## Timeline & Presentation Breakdown

| Time | Section | Key Talking Points & Actions |
| :--- | :--- | :--- |
| **0:00 - 1:00** | **1. Introduction & Challenge Overview** | Welcome the interviewer. State the objective: building an autonomous agent that takes natural language requests, dynamically plans steps, executes them in dependency order, reviews output quality, and creates executive Microsoft Word documents. |
| **1:00 - 3:00** | **2. Standard Request Live Demonstration** | Show `demo_requests.json` (Test Case 1: 8-week e-commerce AI chatbot). Execute `POST /agent` via curl or Python script. Highlight HTTP 200 response, document type `Project Plan`, explicit assumptions, and dynamic 4-step execution trace. |
| **3:00 - 4:45** | **3. Complex / Ambiguous Request Demo** | Execute Test Case 2 (proposal for small team, limited budget, unselected vendor). Point out how the agent did not invent fake vendor costs, explicitly declared operational assumptions, compared a lightweight pilot vs full rollout, and established risk guardrails. |
| **4:45 - 5:45** | **4. Generated Plan, Task Lifecycle & Word Docs** | Demonstrate the lifecycle transitions: `pending` -> `in_progress` -> `completed`. Download both generated documents via `/documents/{filename}` and inspect the Microsoft Word output: professional palette (Navy `#1F4E79`), executive summary, metadata box, tables, and footers. |
| **5:45 - 7:00** | **5. Architecture & Primary Improvement** | Open `ARCHITECTURE.md` and explain the Mermaid diagram. Highlight the **Primary Engineering Improvement: Dynamic Multi-Step Planning with Topological Execution**. Explain cycle detection (Kahn's algorithm) and reflection/quality checking with bounded repair. |
| **7:00 - 8:00** | **6. Debugging Insight** | Share a concrete debugging issue: `pytest` ModuleNotFoundError due to missing `pytest.ini` pythonpath setting and mock isolation in httpx test client. Explain root cause and exact fix implemented. |
| **8:00 - 9:00** | **7. Engineering Tradeoffs & Conclusion** | Discuss Simplicity vs. Extensibility (why we selected a lightweight explicit tool registry over LangChain/CrewAI). Summarize future work: streaming tokens, async background worker queues (Celery/Redis), and user template ingestion. |

---

## Live Demonstration Commands for PowerShell

### 1. Start Server
```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Verify Health
```powershell
curl http://127.0.0.1:8000/health
```

### 3. Run Standard Request (Test Case 1)
```powershell
curl -X POST http://127.0.0.1:8000/agent `
  -H "Content-Type: application/json" `
  -d '{"request":"Create a project plan for launching an AI-powered customer support chatbot for a 50-person e-commerce company within 8 weeks. Include phases, milestones, risks, owners, and success metrics."}'
```

### 4. Run Complex Request (Test Case 2)
```powershell
curl -X POST http://127.0.0.1:8000/agent `
  -H "Content-Type: application/json" `
  -d '{"request":"Prepare a proposal for improving our customer support. We have a small team, a limited budget, and want to use AI, but we have not chosen a vendor or defined success metrics. Make reasonable assumptions, compare a lightweight pilot with a full rollout, identify risks, and recommend next steps without inventing exact costs."}'
```

### 5. Run Test Suite
```powershell
pytest -v
```

