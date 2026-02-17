# System B: Generator Service - Implementation Guide

## Tech Stack
-   **Runtime**: Node.js (TypeScript)
-   **Framework**: NestJS (recommended for structure) or Express/FastAPI
-   **AI/LLM**: LangChain.js (Google Gemini / OpenAI)
-   **Queue**: BullMQ (Redis) for async processing
-   **Validation**: Zod

---

## Development Phases

### Phase 1: Project Setup & Core Structure (Day 1-2)
**Goal**: Initialize a robust project structure capable of handling async jobs.
-   [ ] **Init**: Set up Node.js TypeScript project (`npm init`).
-   [ ] **Config**: Setup `dotenv` for API Keys (ESCO, ONET, OPENAI/GEMINI).
-   [ ] **Queue**: Setup Redis and BullMQ for job processing.
-   [ ] **API**: Create a simple POST endpoint to receive jobs.

### Phase 2: The "Researchers" (Data Connectors) (Day 3-5)
**Goal**: Build independent adapters for each data source.
-   [ ] **ESCO Adapter**: Implement `findOccupation(keyword)` and `getOccupationDetails(uri)`.
-   [ ] **O*NET Adapter**: Implement `searchCareers(keyword)` and `getToolsAndTasks(socCode)`.
-   [ ] **Lightcast Adapter**: Implement skill extraction.
-   [ ] **File Loader**: Implement PDF parsing logic.
-   [ ] **Unit Tests**: Verify each adapter gets data correctly.

### Phase 3: The "Architect" (AI Synthesis Engine) (Day 6-10)
**Goal**: The brain of the system.
-   [ ] **Prompt Engineering**:
    -   Draft "Normalization Prompt" (Merge skills).
    -   Draft "SFIA Grading Prompt" (Assign Levels).
    -   Draft "Dependency Prompt" (Create Edges).
-   [ ] **LangChain Implementation**:
    -   Chain 1: `Raw Data -> List of Clean Nodes`
    -   Chain 2: `Nodes -> Nodes with Levels`
    -   Chain 3: `Nodes -> Edges`
-   [ ] **Graph Validator**: Implement DFS/Cycle Detection algorithm to sanitize output.

### Phase 4: Integration & Export (Day 11-12)
**Goal**: Connect everything together.
-   [ ] **Pipeline Orchestration**: Write the `Worker` logic that calls Phase 2 -> Phase 3 -> Phase 3 (Validator).
-   [ ] **Webhook Sender**: Implement logic to POST the final JSON back to System A (Core).
-   [ ] **Error Handling**: Graceful failure if AI hallucinates or APIs timeout.

### Phase 5: Testing & Optimization (Day 13+)
-   [ ] **End-to-End Test**: Run a full job "Software Engineer" and inspect the JSON.
-   [ ] **Cost Optimization**: Check Token usage of Gemini/OpenAI.
-   [ ] **Latency Optimization**: Parallelize the Research Phase calls.
