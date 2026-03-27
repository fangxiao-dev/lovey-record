# Backend Implementation Plan: Express + CloudBase MySQL + Prisma

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a REST API backend for the menstrual tracking mini-program using Express, Prisma ORM, and CloudBase MySQL, with session-based auth and derived data (cycles, predictions) computed on every day_record mutation.

**Architecture:** Single Express app running in WeChat 云托管 container. Session auth via WeChat x-wx-openid header injection. All state changes trigger synchronous recalculation of derived cycles and predictions. Domain model from contracts/ maps 1:1 to Prisma schema.

**Tech Stack:** Node.js 20, Express 4, TypeScript 5, Prisma 5, CloudBase MySQL 8.0, express-session, Jest, Supertest

---

## Final Tech Stack Summary

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Node.js 20 | Standard, TypeScript-first |
| Framework | Express 4 + TypeScript | Simple, no over-engineering, aligns with minimal structure |
| ORM | Prisma 5 | Schema-first, auto types, migrations built-in |
| Database | CloudBase MySQL 8.0 | Relational, matches domain model perfectly |
| Auth | Session-based via x-wx-openid header | Immediate access revocation on partner removal |
| Session Store | In-memory for MVP, migrate to MySQL sessions later | Simplicity first; single 云托管 instance doesn't need distributed store yet |
| Testing | Jest + Supertest | Unit tests (mocked Prisma), integration tests (real DB or test instance) |
| Deployment | Docker on 云托管 | Standard container deployment |

---

## Prisma Schema

**File:** `backend/prisma/schema.prisma`

```prisma
// This file was auto-generated from backend Prisma setup
// Maps domain model entities 1:1 to database tables

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ===== Core Domain =====

model User {
  id        String   @id @default(cuid())
  openid    String   @unique  // WeChat openid from cloud.getWXContext()
  createdAt DateTime @default(now()) @map("created_at")

  // Relationships
  profile   Profile?
  accesses  ModuleAccess[]

  @@map("users")
}

model Profile {
  id          String   @id @default(cuid())
  ownerUserId String   @unique @map("owner_user_id")
  displayName String?  @map("display_name")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relationships
  owner              User             @relation(fields: [ownerUserId], references: [id], onDelete: Cascade)
  moduleInstances    ModuleInstance[]
  dayRecords         DayRecord[]
  derivedCycles      DerivedCycle[]
  predictions        Prediction[]

  @@map("profiles")
}

model ModuleInstance {
  id            String        @id @default(cuid())
  moduleType    String        @map("module_type")  // "menstrual" for MVP
  ownerUserId   String        @map("owner_user_id")
  profileId     String        @map("profile_id")
  sharingStatus SharingStatus @default(PRIVATE) @map("sharing_status")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  // Relationships
  profile      Profile        @relation(fields: [profileId], references: [id], onDelete: Cascade)
  accesses     ModuleAccess[]
  dayRecords   DayRecord[]
  cycles       DerivedCycle[]
  prediction   Prediction?

  @@index([ownerUserId])
  @@index([profileId])
  @@map("module_instances")
}

model ModuleAccess {
  id               String       @id @default(cuid())
  moduleInstanceId String       @map("module_instance_id")
  userId           String       @map("user_id")
  role             AccessRole   @default(PARTNER)
  accessStatus     AccessStatus @default(ACTIVE) @map("access_status")
  grantedAt        DateTime     @default(now()) @map("granted_at")
  revokedAt        DateTime?    @map("revoked_at")

  // Relationships
  moduleInstance ModuleInstance @relation(fields: [moduleInstanceId], references: [id], onDelete: Cascade)
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([moduleInstanceId, userId])
  @@index([userId])
  @@map("module_accesses")
}

// ===== Recording & Derivation =====

model DayRecord {
  id               String        @id @default(cuid())
  moduleInstanceId String        @map("module_instance_id")
  profileId        String        @map("profile_id")
  date             DateTime      @db.Date
  bleedingState    BleedingState @map("bleeding_state")
  painLevel        Int?          @map("pain_level")  // 1-5, null means implicit none
  flowLevel        Int?          @map("flow_level")   // 1-5
  colorLevel       Int?          @map("color_level")  // 1-5
  note             String?       @db.VarChar(500)
  source           String?  // "app" | "sync" | etc.
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

  // Relationships
  moduleInstance ModuleInstance @relation(fields: [moduleInstanceId], references: [id], onDelete: Cascade)
  profile        Profile        @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([moduleInstanceId, profileId, date])
  @@index([moduleInstanceId, date])
  @@index([profileId, date])
  @@map("day_records")
}

model DerivedCycle {
  id               String   @id @default(cuid())
  moduleInstanceId String   @map("module_instance_id")
  profileId        String   @map("profile_id")
  startDate        DateTime @db.Date @map("start_date")
  endDate          DateTime @db.Date @map("end_date")
  durationDays     Int      @map("duration_days")
  derivedFromDates String   @map("derived_from_dates")  // JSON stringified array of YYYY-MM-DD
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relationships
  moduleInstance ModuleInstance @relation(fields: [moduleInstanceId], references: [id], onDelete: Cascade)
  profile        Profile        @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([moduleInstanceId, profileId, startDate])
  @@map("derived_cycles")
}

model Prediction {
  id                   String   @id @default(cuid())
  moduleInstanceId     String   @unique @map("module_instance_id")
  profileId            String   @map("profile_id")
  predictedStartDate   DateTime @db.Date @map("predicted_start_date")
  predictionWindowStart DateTime @db.Date @map("prediction_window_start")
  predictionWindowEnd  DateTime @db.Date @map("prediction_window_end")
  basedOnCycleCount    Int      @map("based_on_cycle_count")
  computedAt           DateTime @default(now()) @map("computed_at")

  // Relationships
  moduleInstance ModuleInstance @relation(fields: [moduleInstanceId], references: [id], onDelete: Cascade)
  profile        Profile        @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId])
  @@map("predictions")
}

// ===== Enums =====

enum SharingStatus {
  PRIVATE
  SHARED
}

enum BleedingState {
  PERIOD
  SPOTTING
}

enum AccessRole {
  OWNER
  PARTNER
}

enum AccessStatus {
  ACTIVE
  REVOKED
}
```

---

## Project Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma           # Prisma schema (see above)
│   └── migrations/             # Auto-generated by Prisma
├── src/
│   ├── types/
│   │   └── index.ts           # Shared TS types (User, Module, etc.)
│   ├── config/
│   │   └── index.ts           # App config, env vars
│   ├── db/
│   │   └── prisma.ts          # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.ts            # Parse x-wx-openid header, create/find user, attach to req.user
│   │   └── errorHandler.ts    # Global error handler
│   ├── services/
│   │   ├── dayRecord.service.ts       # Commands: recordDayState, recordDateRangeAsPeriod, clearDayRecord
│   │   ├── cycle.service.ts           # Core: computeCycles(), handles split/merge logic
│   │   ├── prediction.service.ts      # Core: computePrediction() from cycles
│   │   ├── moduleInstance.service.ts  # Commands: createModuleInstance, shareModuleInstance, revokeModuleAccess
│   │   └── auth.service.ts            # Helpers: findOrCreateUser
│   ├── controllers/
│   │   ├── dayRecord.controller.ts
│   │   ├── moduleInstance.controller.ts
│   │   └── query.controller.ts        # All read-only endpoints
│   ├── routes/
│   │   ├── commands.ts         # POST endpoints
│   │   └── queries.ts          # GET endpoints
│   └── app.ts                   # Express app setup
├── package.json
├── tsconfig.json
├── .env.example
└── Dockerfile

tests/
├── unit/
│   ├── services/dayRecord.service.test.ts
│   ├── services/cycle.service.test.ts
│   └── services/prediction.service.test.ts
├── integration/
│   ├── commands.integration.test.ts
│   └── queries.integration.test.ts
└── setup.ts
```

---

## Auth Flow

**Context:** Running in WeChat 云托管 container. WeChat injects user identity via HTTP headers automatically when called from mini-program via `wx.cloud.callContainer()`.

1. **Frontend initiates request:**
   ```javascript
   wx.cloud.callContainer({
     path: '/api/commands/recordDayState',
     method: 'POST',
     data: { moduleInstanceId: '...', date: '2026-03-27', bleedingState: 'period' }
   })
   ```

2. **WeChat cloud injects headers:**
   - `x-wx-openid`: user's WeChat openid
   - `x-wx-appid`: app id
   - Others (signature, etc.)

3. **Auth middleware reads header:**
   - Extract `req.headers['x-wx-openid']`
   - Find existing User or create new one
   - Attach to `req.user = { id, openid }`
   - Next middleware/controller receives authenticated request

4. **Session (optional, for MVP):**
   - For MVP, just attach to request object (stateless)
   - Later: add `express-session` if needed for persistence across requests

5. **Authorization check:**
   - Controller verifies user has access to requested `moduleInstanceId`
   - Check ModuleAccess record or owner check
   - Reject with 403 if no permission

---

## Data Flow on Record Mutation

Every command that modifies `day_record` (recordDayState, recordDateRangeAsPeriod, clearDayRecord) follows this pattern:

```
User Input
  ↓
Validate Input (date in past, note length, etc.)
  ↓
Verify Access (user owns or has partner access to moduleInstanceId)
  ↓
Mutate DayRecord (create/update/delete)
  ↓
Recompute Cycles (from all day_records with bleedingState=period)
  ↓
Store Cycles in DerivedCycle table
  ↓
Recompute Prediction (from cycle start dates)
  ↓
Store Prediction in Prediction table
  ↓
Return Response (ok, data, recomputed flags)
```

**Key Rules:**
- `DayRecord` is the only persisted source of truth
- `DerivedCycle` and `Prediction` are always recalculated synchronously
- Consecutive `period` dates = one cycle block
- Single-day `period` is a valid cycle
- Filling/clearing dates can merge/split cycles
- Prediction computed from cycle start dates, not user-authored end dates

---

## Implementation Phases

### Phase 1: Project Setup + Database

**Tasks:**
1. Initialize Express + TypeScript project structure
2. Set up Prisma + CloudBase MySQL
3. Run initial migration
4. Verify database connection

### Phase 2: Auth + Request Pipeline

**Tasks:**
5. Implement auth middleware (x-wx-openid header parsing)
6. User find-or-create service
7. Global error handler
8. Request/response envelope pattern

### Phase 3: MVP Commands (First 3)

**Tasks:**
9. `createModuleInstance` - owner creates instance, triggers no cycle logic yet
10. `recordDayState` - create/update single day record + full recalculation
11. **CORE: Cycle Derivation Service** - compute cycles from day_records
12. **CORE: Prediction Service** - compute prediction from cycles
13. `recordDateRangeAsPeriod` - batch create consecutive period days
14. `clearDayRecord` - delete record + recalculation

### Phase 4: MVP Queries (First 3)

**Tasks:**
15. `getModuleHomeView` - aggregated read model (status, cycle, prediction, marks)
16. `getDayRecordDetail` - single day record detail
17. `getModuleAccessState` - sharing state, partners list

### Phase 5: Phase 2 Endpoints (Remaining)

**Tasks:**
18. `recordDayDetails` - update pain/flow/color levels on existing record
19. `recordDayNote` - attach note to record
20. `shareModuleInstance` - grant partner access
21. `revokeModuleAccess` - revoke partner access
22. `getCalendarWindow` - day records in date range
23. `getPredictionSummary` - prediction alone
24. Integration tests for all endpoints
25. Deploy to 云托管

---

## Detailed Task Breakdown

(To be expanded in execution phase with test code, implementation code, and commit commands. Each task follows TDD: failing test → minimal implementation → passing test → commit.)

---

## Local Development Setup

### Prerequisites
```bash
Node.js 20+
MySQL 8.0 (local or Docker)
```

### First-time setup
```bash
# 1. Install dependencies
npm install

# 2. Set up .env
cp .env.example .env
# Edit .env with local MySQL connection string
DATABASE_URL="mysql://root:password@localhost:3306/lovey_record"

# 3. Initialize Prisma + run migrations
npx prisma migrate dev --name init

# 4. Start dev server
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Accessing 云托管 in development
- **Option A (Recommended):** Use WeChat DevTools' cloud IDE with local Node debugger
- **Option B:** Run locally, mock x-wx-openid header in test requests
  ```bash
  curl -H "x-wx-openid: test_openid_123" http://localhost:3000/api/queries/getModuleHomeView?moduleInstanceId=mi_123
  ```

---

## Deployment Flow

### Build & Test
```bash
npm run build
npm test
```

### Docker Image
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/server.js"]
```

### Deploy to 云托管
1. Build Docker image
2. Push to WeChat artifact registry
3. Create/update cloud hosting service pointing to image
4. Run migrations in cloud: `npm run migrate:prod`
5. Monitor logs via 云托管 dashboard

---

## Key Dependencies (package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.7.0",
    "express-session": "^1.17.3",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "@types/express-session": "^1.17.10",
    "prisma": "^5.7.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2",
    "ts-node": "^10.9.2",
    "ts-jest": "^29.1.1"
  }
}
```

---

## Open Questions to Resolve During Implementation

1. **Note length limit:** Contract says "maximum length rule" but exact limit TBD. Suggest: 500 chars (current schema). Confirm?
2. **Pain/Flow/Color defaults:** Contract says default is level 3. Should empty submission use level 3, or should levels be optional until explicitly set?
3. **Cycle algorithm edge cases:** What if user has only 1 period day ever recorded? Valid cycle? (Domain model says yes, but confirm).
4. **Prediction window:** Suggest ±2 days around predicted start. Confirm?
5. **Session persistence:** For MVP in-memory is fine. When scaling to multiple 云托管 instances, migrate to CloudBase-backed session store?

---

## Next Steps

1. Review this plan
2. Clarify open questions above
3. Execute Phase 1 (setup) in a worktree
4. Checkpoint after Phase 2 (auth working + error handler)
5. Execute Phase 3-5 tasks in sequence (TDD style)

**Estimated effort:** ~2-3 days for MVP (Phase 1-4), ~1 day for Phase 5 (remaining endpoints)
