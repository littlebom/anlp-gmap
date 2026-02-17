# Technology Stack & Architecture

## Frontend
- **Framework:** React (Vite) + TypeScript
- **State Management:** Zustand (Simpler than Redux for POC)
- **UI Components:** shadcn/ui + Tailwind CSS
- **Visualization:** React Flow (For the Node Graph)
- **Icons:** Lucide React

## Backend
- **Framework:** NestJS (Node.js) + TypeScript
- **Architecture:** Modular Monolith (Modules: Auth, Graph, Learning, User)
- **Documentation:** Swagger (OpenAPI)

## Database
- **Core DB:** PostgreSQL (v15+)
- **ORM:** Prisma
- **Vector Extension:** pgvector (For storing embedding of knowledge nodes)

## AI Integration
- **LLM Orchestration:** LangChain.js
- **Model:** OpenAI GPT-4o (or GPT-3.5-turbo for cost saving in dev)