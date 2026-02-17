# System B: Generator Service - System Requirements Specification (SRS)

## 1. Introduction
System B is a dedicated microservice responsible for the autonomous generation of "Knowledge Graphs" for the ANLP platform. It acts as an intelligent factory that ingests raw data from multiple sources and synthesizes it into a structured learning path using AI.

## 2. User User Stories (Admin)
- **As an Admin**, I want to input a "Job Title" so that the system can automatically generating a full curriculum graph.
- **As an Admin**, I want to upload PDF/Text documents so that the AI can include specific domain knowledge in the graph.
- **As an Admin**, I want to configure the "Maximum Nodes" limit (e.g., 20-50 nodes) to control the graph size.
- **As an Admin**, I want to see the status of the generation process (Queued, Processing, Completed, Failed).

## 3. Functional Requirements

### 3.1 Data Ingestion (The Researchers)
The system must be able to fetch data from the following "Big 4" sources:
1.  **ESCO API (European Skills/Competences)**:
    -   search for occupation by name.
    -   Retrieve `essentialSkills` and `optionalSkills`.
2.  **O*NET Web Services**:
    -   Search for SOC Code by keyword.
    -   Retrieve `tools_and_technology` and `task_statements`.
3.  **Lightcast Open Skills API**:
    -   Retrieve trending skills related to the job title.
4.  **Document Parser**:
    -   Accept `.pdf`, `.docx`, `.txt` files.
    -   Extract text content for context injection.

### 3.2 Synthesis Engine (The Architect)
The system must use an LLM (Google Gemini / OpenAI) to perform:
1.  **Normalization**: Merge similar terms (e.g., "Python 3" + "Python Programming" -> "Python").
2.  **SFIA Grading**: Assign a level (1-7) to each node based on the SFIA Framework.
3.  **Dependency Mapping**: Determine parent-child relationships based on logical prerequisites.

### 3.3 Validation Logic
The system must enforce:
-   **No Cycles**: The graph must be a DAG (Directed Acyclic Graph).
-   **Single Root**: Ideally one starting point, or a clear cluster of Level 1 nodes.
-   **Connectivity**: No orphan nodes allowed.

### 3.4 API Interface
-   `POST /jobs`: Create a new generation job.
-   `GET /jobs/:id`: Check status.
-   `webhook`: Send JSON payload to Core System upon completion.

## 4. Non-Functional Requirements
-   **Performance**: Graph generation should complete within 3-5 minutes.
-   **Reliability**: Failed external API calls should retry automatically (Exponential Backoff).
-   **Scalability**: Must handle multiple jobs in parallel using a Queue system (BullMQ).
-   **Tech Stack**: TypeScript (Node.js), LangChain.js, Zod.

## 5. Deliverable Format (Output)
The service must produce a JSON object following this schema:
```json
{
  "jobId": "uuid",
  "jobTitle": "String",
  "nodes": [
    {
      "id": "uuid",
      "label": "String",
      "description": "String",
      "sfia_level": 1-7,
      "source": "ESCO|ONET|AI"
    }
  ],
  "edges": [
    { "source": "node_id_A", "target": "node_id_B" }
  ]
}
```
