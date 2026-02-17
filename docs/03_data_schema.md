# Data Schema Design (Prisma Model)

## Knowledge Graph Node Hierarchy (L1–L5)

| Node Level | Type | Description | Example | View |
|---|---|---|---|---|
| **L1** | Category | หมวดหมู่อาชีพ | Software Development, Data & AI | Galaxy |
| **L2** | Job Title | ตำแหน่งงาน/อาชีพ | Python Developer, ML Engineer | Galaxy (zoom) |
| **L3** | Skill | ทักษะหลัก | OOP, Flask, Testing | Constellation |
| **L4** | Sub-Skill | ทักษะย่อย | Inheritance, Polymorphism | Focus (graph) |
| **L5** | Learning Unit | หน่วยเรียนรู้ | Metaclasses, Singleton Pattern | Focus (list) |

> **Note:** Node Level (L1–L5) หมายถึงระดับความลึกในโครงสร้าง Graph
> ไม่เกี่ยวกับ SFIA Level (L1–L7) ซึ่งบ่งบอกระดับความเชี่ยวชาญ

## Models

### User
- id: UUID
- email: String
- name: String
- learning_history: Relation to UserProgress

### SkillNode (The Knowledge Atom)
- id: String (e.g., "node_python_vars")
- title: String
- description: Text
- nodeLevel: Enum (L1_CATEGORY, L2_JOB_TITLE, L3_SKILL, L4_SUB_SKILL, L5_LEARNING_UNIT)
- cluster: String (e.g., "Logic", "Data", "Structure")
- sfiaLevel: Int? (1–7, ระดับความเชี่ยวชาญ SFIA)
- parentId: FK SkillNode? (points to parent node)
- embedding: Unsupported("vector(1536)")? // For RAG
- prerequisites: Self-Relation (Many-to-Many)
- isShared: Boolean (true if this skill appears in multiple L2 Job Titles)
- sharedCount: Int? (number of L2 jobs that share this skill)

### UserProgress
- user_id: FK User
- node_id: FK SkillNode
- status: Enum (LOCKED, UNLOCKED, COMPLETED)
- score: Float
- last_interacted: DateTime

## Graph Logic
- A node is `UNLOCKED` only if ALL its `prerequisites` are `COMPLETED`.
- L1 → L2 → L3 → L4 → L5 forms a tree hierarchy via `parentId`.
- Shared skills (isShared = true) can have multiple parents across different L2 Job Titles.

## Navigation Flow
```
Galaxy View (L1 + L2)  →  Constellation View (L3)  →  Focus View (L4 + L5)
mockup_galaxy.html        mockup_generator.html       mockup_focus.html
```