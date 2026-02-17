# ANLP-GSM — Generator Service Module

> AI Architect ระบบสร้าง Knowledge Graph อัตโนมัติจากชื่ออาชีพ

## ภาพรวม

ANLP-GSM (Generator Service Module) เป็นระบบที่รับชื่ออาชีพ (เช่น "Python Developer") แล้วสร้าง **Knowledge Graph** โดยอัตโนมัติ ผ่านการสังเคราะห์ข้อมูลจากแหล่งภายนอก + AI

### สถาปัตยกรรม

```
User → POST /generate → BullMQ Queue → Generator Processor
                                              ↓
                                    ┌─────────┴──────────┐
                                    │   Data Adapters     │
                                    │  ESCO · O*NET ·     │
                                    │  Lightcast           │
                                    └─────────┬──────────┘
                                              ↓
                                    ┌─────────┴──────────┐
                                    │   AI Pipeline       │
                                    │  1. Normalization    │
                                    │  2. SFIA Grading     │
                                    │  3. Dependency Map   │
                                    └─────────┬──────────┘
                                              ↓
                                    Knowledge Graph JSON
```

## โครงสร้างโปรเจค

```
ANLP-GSM/
├── generator-service/    # Backend service (Node.js + TypeScript)
│   ├── src/
│   │   ├── modules/      # ESCO, O*NET, Lightcast, Architect, Generator
│   │   ├── config/       # Environment + Redis config
│   │   └── server.ts     # Entry point
│   └── package.json
├── mockups/              # UI mockup prototypes (HTML)
│   ├── mockup_galaxy.html        # L1-L2 Galaxy View
│   ├── mockup_generator.html     # L3 Constellation View
│   ├── mockup_focus.html         # L4-L5 Focus View
│   ├── mockup_category.html      # Category View
│   └── ...
├── docs/                 # Documentation
│   ├── PRD.md
│   └── 03_data_schema.md
├── docker-compose.yml    # Redis
└── .env                  # API Keys
```

## Quick Start

### Prerequisites
- Node.js 18+
- Redis (หรือใช้ Docker)
- API Key: Google Gemini หรือ OpenAI

### Setup

```bash
# 1. Start Redis
docker compose up -d

# 2. Install dependencies
cd generator-service
npm install

# 3. Configure .env
cp .env.example .env
# แก้ไข API_KEY_GEMINI หรือ API_KEY_OPENAI

# 4. Start service
npm run dev
```

### API Usage

```bash
# สร้าง Knowledge Graph
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "Python Developer"}'

# ตรวจสถานะ
curl http://localhost:3000/jobs/{jobId}
```

### Mockups

เปิดไฟล์ HTML ใน `mockups/` folder โดยตรงในเบราว์เซอร์:
- **Galaxy View:** `mockups/mockup_galaxy.html`
- **Constellation View:** `mockups/mockup_generator.html?job=python_dev`
- **Focus View:** `mockups/mockup_focus.html`

## Backup & Restore

### Backup
โปรเจคนี้มีการสำรองข้อมูลไว้ในโฟลเดอร์ `backups/`:
- **Database Dump:** `backups/db_dump.sql` (สร้างโดย `pg_dump`)

### Restore Database
หากต้องการ Restore ข้อมูลลงใน Docker:
```bash
docker exec -i anlp-postgres psql -U postgres anlp_db < backups/db_dump.sql
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Job Queue | BullMQ (Redis) |
| AI | LangChain.js + Gemini 2.0 Flash / GPT-4o |
| Data Sources | ESCO API, O*NET, Lightcast |

## License

Private — Internal use only
