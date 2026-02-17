Product Requirements Document (PRD)Project Name: AI-Native Adaptive Learning Platform (POC)Version: 2.0 (Integrated Multi-Source Intelligence)Date: 2026-02-10Status: Ready for Development1. Executive Summary (บทสรุปผู้บริหาร)เรากำลังพัฒนาแพลตฟอร์มการเรียนรู้รูปแบบใหม่ (AI-Native) ที่ฉีกกฎ LMS เดิมๆ โดยเปลี่ยนจาก "รายวิชาที่เป็นเส้นตรง" (Linear Courses) มาเป็น "แผนผังความรู้" (Knowledge Graph)ในระบบนี้ ผู้เรียนจะเดินทางผ่าน "Node" ความรู้ที่เชื่อมโยงกัน โดยมี AI Tutor (น้องยัก) เป็นผู้สอนส่วนตัว และระบบ Graph Generator อัจฉริยะที่สร้างหลักสูตรโดยอัตโนมัติจากการสังเคราะห์ข้อมูลมาตรฐานโลก 4 แหล่ง (ESCO, O*NET, Lightcast, SFIA) เพื่อให้เนื้อหาทันสมัยและได้มาตรฐานสากลเป้าหมายของ POC คือการพิสูจน์ว่าระบบการเรียนรู้แบบ Graph-based, AI-driven และ Personalized Learning สามารถทำงานได้จริง2. Target Audience (กลุ่มเป้าหมาย)Learner (User): คนที่ต้องการเรียนรู้ทักษะใหม่ (Reskill/Upskill) ต้องการเห็น Roadmap ที่ชัดเจน และชอบการโต้ตอบมากกว่าการดูวิดีโอCurator/Admin: ผู้ออกแบบโครงสร้างการเรียนรู้ ที่ต้องการเครื่องมือ AI ช่วยสร้างหลักสูตร (Curriculum) จากมาตรฐานอาชีพ3. Core Features (ฟีเจอร์หลัก)3.1 Interactive Knowledge Map (หน้าจอแผนที่ความรู้)Visualization: แสดงผล Node ความรู้แบบ 2D Graph (React Flow)Dynamic States:🔒 LOCKED (สีเทา): ยังเรียนไม่ได้ (Prerequisite ยังไม่ครบ)🔓 UNLOCKED (สีฟ้า/Active): พร้อมเรียน✅ COMPLETED (สีเขียว): เรียนจบและสอบผ่านแล้วNavigation: Zoom, Pan, และ Auto-focus ไปยัง Node ล่าสุด3.2 AI Tutor Chat (ห้องเรียนส่วนตัว)Context-Aware: AI รู้ว่า User กำลังเรียน Node ไหน และประวัติการเรียนเป็นอย่างไรRAG Integration: ดึงเนื้อหาที่ถูกต้องจาก Vector Database มาตอบ (ป้องกัน Hallucination)Persona: "น้องยัก" (เป็นกันเอง, ให้กำลังใจ, อธิบายง่าย)3.3 Dynamic Assessment (ระบบวัดผล)Quiz Generation: AI สร้างโจทย์ทดสอบความเข้าใจ 1-3 ข้อ หลังเรียนจบ NodeInstant Feedback: ตรวจคำตอบทันที พร้อมอธิบายเฉลยProgression Logic: ถ้าผ่าน -> ปลดล็อก Node ถัดไป / ถ้าไม่ผ่าน -> แนะนำให้ทบทวน3.4 Advanced Graph Generator (ระบบสร้างคอร์สอัจฉริยะ)Multi-Source Synthesis: ระบบรับชื่อ "อาชีพ" หรือ "ทักษะ" แล้วสร้าง Graph โดยดึงข้อมูลจาก:ESCO / O*NET: เพื่อเอาโครงสร้างหลัก (Skeleton) และคำนิยามมาตรฐานLightcast: เพื่อเอาทักษะและเครื่องมือที่ทันสมัย (Trending Tech)SFIA Framework: เพื่อกำหนดระดับความลึก (Level 1-7) ของแต่ละ NodeOutput: JSON Structure ที่ระบุ Nodes, Edges, และ Metadata (Description, Tools)3.5 Authentication & e-ProfileAuth: สมัคร/ล็อกอิน (JWT Token)Profile Dashboard:แสดง Level ปัจจุบัน (คำนวณจาก XP/Nodes completed)Skill Radar Chart (แสดงความถนัดแยกตาม Category)Learning Streak (จำนวนวันที่เรียนต่อเนื่อง)4. Technical Requirements (สเปกทางเทคนิค)4.1 Technology StackFrontend:Framework: React (Vite) + TypeScriptGraph Lib: React Flow (สำคัญมาก)UI Lib: shadcn/ui + Tailwind CSS + Lucide ReactState: ZustandBackend:Framework: NestJS (Node.js) + TypeScriptAPI Doc: Swagger (OpenAPI)Database:Core: PostgreSQL (v15+)ORM: PrismaVector: pgvector extensionAI Engine:Orchestration: LangChain.jsModel: OpenAI GPT-4o (หรือ Local LLM ผ่าน Ollama)4.2 Architecture Diagramgraph TD
    User --> Frontend[React App]
    Frontend --> API[NestJS Gateway]
    
    subgraph "Backend Services"
        API --> AuthService
        API --> LearningService
        API --> GraphService
    end
    
    subgraph "Intelligence Layer"
        GraphService --> LLM[LangChain/OpenAI]
        LLM --> ExtAPI_1[ESCO API]
        LLM --> ExtAPI_2[O*NET API]
        LLM --> ExtAPI_3[Lightcast Open Skills]
    end
    
    subgraph "Data Layer"
        LearningService --> DB[(PostgreSQL)]
        DB --> Vector[(pgvector)]
    end
4.3 Database Schema (Draft)
User Table: id (UUID), email, password_hash, level, xp, streak_days
SkillNode Table: id (UUID), title (String), description (Text), tools (JSON), sfia_level (Int 1-7), cluster (String), embedding (Vector)
Edge Table: sourceId (UUID) -> targetId (UUID)
UserProgress Table: userId, nodeId, status, score (Float), stars (Int)
Badge Table: id, name, required_cluster
Certificate Table: id, title, graph_id, issued_at

4.4 UI/UX Design Language
Theme Name: "Syntax" (Inspired by Tailwind CSS documentation)
Core Philosophy: Clean, Documentation-style, Content-first.
Color Palette:
- Background: Deep Slate/Zinc (Dark Mode) / White-Zinc (Light Mode)
- Primary: Sky Blue (500/400)
- Secondary: Indigo (500/400)
- Accents: Teal/Emerald for Success, Orange for Streak
Typography: Inter (Clean sans-serif)
Key Elements:
- Glassmorphism: Panels share a semi-transparent blurred background.
- Subtle Gradients: Used for "Active" states and borders.
- Minimalist Icons: Lucide React icons with fine strokes.

4.5 Achievement System (Gamification)
Tier 1 (Micro): XP & Stars (1-3) per Node completion.
Tier 2 (Skill): Badges unlocked upon completing a Cluster (e.g., "Logic Master").
Tier 3 (Career): Verifiable Certificate upon 100% Graph completion.

5. External Integrations (The Big 4)ระบบ Graph Generator ต้องมีการเชื่อมต่อหรืออ้างอิงแหล่งข้อมูลดังนี้:SourceRoleIntegration Method1. ESCOFoundation: มาตรฐานอาชีพและทักษะของยุโรปREST API (ec.europa.eu)2. O*NETContext: รายละเอียด Task และเครื่องมือ (Tools)REST API (services.onetcenter.org)3. LightcastTrend: ทักษะเฉพาะทางและเทคโนโลยีใหม่ๆOpen Skills API4. SFIALogic/Depth: กฎเกณฑ์ในการแบ่งระดับความยากSystem Prompt (LLM Logic)6. AI Service Architecture6.1 GraphGeneratorService (The Architect)Trigger: Admin กรอกชื่ออาชีพ (เช่น "Junior Python Developer")Process:Fetch ESCO/O*NET -> ได้ Core CompetenciesEnrich with Lightcast -> ได้ Modern ToolsLLM Processing: นำข้อมูล 1+2 มาสร้าง Graph โดยใช้ SFIA Framework เป็นเกณฑ์ในการจัดลำดับ (Sequence) และความลึกSave: บันทึกลง DB เป็น Node/Edge6.2 TutorService (The Teacher)รับคำถามจาก User -> ค้นหา Vector ใน SkillNode -> สร้าง Prompt -> ตอบกลับ7. Success Metrics (POC)Functional Graph: ระบบสร้าง Graph อัตโนมัติจากอาชีพ "Python Developer" ได้อย่างน้อย 20 Nodes ที่มีความสัมพันธ์ถูกต้องData Integration: Node ที่สร้างขึ้นต้องมีข้อมูลอ้างอิง (เช่น ระบุว่าใช้ Tool อะไรจาก O*NET)Learning Flow: User ไม่สามารถข้ามไปเรียน Node ลูกได้ ถ้ายังไม่ผ่าน Node แม่AI Interaction: AI Tutor ตอบคำถามได้ตรงบริบทของ Node นั้นๆAppendix A: System Prompt for Graph Generation (Example)You are an Expert Curriculum Architect designed to build Knowledge Graphs.
Your goal is to decompose the occupation "{occupation_name}" into a dependency graph of atomic learning nodes.

**Data Sources to Use:**
1. Core Skills from ESCO: {esco_data}
2. Tools & Tech from O*NET: {onet_data}
3. Modern Trends from Lightcast: {lightcast_data}

**Rules (SFIA Framework):**
- Level 1-2 Nodes: Focus on "Knowledge" (Remember/Understand). Basic Syntax, Concepts.
- Level 3-4 Nodes: Focus on "Application" (Apply/Analyze). Writing Functions, Debugging.
- Level 5+ Nodes: Focus on "Strategy" (Evaluate/Create). System Design, Architecture.

**Output Format:**
Return a JSON object with "nodes" and "edges".
Each node must have: id, title, description, category, sfia_level, tools (list).
