# Sharing Read-Only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a module owner to invite one participant via a WeChat mini program card; the participant joins with read-only access to the same `ModuleInstance`.

**Architecture:** Single-use invite tokens live in a new `InviteToken` table. The token travels inside `wx.shareAppMessage` path params to a new `pages/join/index` landing page. On accept, a `ModuleAccess` row with `role: VIEWER` is written atomically with the token being marked used. The menstrual home page hides all write controls when the caller's role is `VIEWER`.

**Tech Stack:** Prisma (MySQL), Express, TypeScript (backend); uni-app Vue 3, plain JS services (frontend); Jest + Supertest (tests)

**Spec:** `docs/superpowers/specs/2026-04-09-sharing-read-only-design.md`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `backend/prisma/schema.prisma` | Modify | Add `VIEWER` to `AccessRole`, add `InviteToken` model |
| `backend/src/services/sharing.service.ts` | Create | `createInviteToken`, `validateInviteToken`, `acceptInvite`, `leaveModule`, `getModuleMembers` |
| `backend/src/services/query.service.ts` | Modify | Update `getModuleAccessState` to return caller's own role and include VIEWER members |
| `backend/src/controllers/sharing.controller.ts` | Create | HTTP handlers for all sharing endpoints |
| `backend/src/routes/commands.ts` | Modify | Register `createInviteToken`, `acceptInvite`, `leaveModule` |
| `backend/src/routes/queries.ts` | Modify | Register `validateInviteToken`, `getModuleMembers` |
| `backend/tests/services/sharing.service.test.ts` | Create | Unit tests for sharing service |
| `backend/tests/integration/sharing.integration.test.ts` | Create | Integration tests for sharing HTTP endpoints |
| `frontend/services/sharing/sharing-command-service.js` | Create | `createInviteToken`, `acceptInvite`, `leaveModule` API calls |
| `frontend/services/sharing/sharing-query-service.js` | Create | `validateInviteToken`, `getModuleMembers` API calls |
| `frontend/pages/join/index.vue` | Create | Invite landing page |
| `frontend/pages.json` | Modify | Register `pages/join/index` |
| `frontend/pages/menstrual/home.vue` | Modify | Read-only mode (hide write controls when `userRole === 'viewer'`), share button |

---

## Task 1: Schema Migration

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add `VIEWER` to `AccessRole` enum and add `InviteToken` model**

In `backend/prisma/schema.prisma`, make these two changes:

```prisma
// Change the enum (around line 130):
enum AccessRole {
  OWNER
  VIEWER
  PARTNER
}
```

Add the new model before the enums section:

```prisma
model InviteToken {
  id               String    @id @default(cuid())
  token            String    @unique
  moduleInstanceId String    @map("module_instance_id")
  createdByUserId  String    @map("created_by_user_id")
  expiresAt        DateTime  @map("expires_at")
  usedAt           DateTime? @map("used_at")
  usedByUserId     String?   @map("used_by_user_id")

  moduleInstance ModuleInstance @relation(fields: [moduleInstanceId], references: [id], onDelete: Cascade)

  @@index([moduleInstanceId])
  @@map("invite_tokens")
}
```

Also add the reverse relation on `ModuleInstance`:

```prisma
model ModuleInstance {
  // ... existing fields ...
  inviteTokens InviteToken[]   // add this line alongside accesses, dayRecords, etc.
}
```

- [ ] **Step 2: Run migration**

```bash
cd backend
npx prisma migrate dev --name add-invite-token-viewer-role
```

Expected: migration files created under `prisma/migrations/`, schema diff applied to DB.

- [ ] **Step 3: Verify generated client**

```bash
npx prisma generate
```

Expected: no errors, `PrismaClient` now has `prisma.inviteToken`.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(db): add InviteToken table and VIEWER role to AccessRole"
```

---

## Task 2: `createInviteToken` Service

**Files:**
- Create: `backend/src/services/sharing.service.ts`
- Create: `backend/tests/services/sharing.service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/services/sharing.service.test.ts`:

```typescript
import prisma from '../../src/db/prisma';
import { createInviteToken } from '../../src/services/sharing.service';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    moduleInstance: { findFirst: jest.fn() },
    inviteToken: { findFirst: jest.fn(), create: jest.fn() },
    moduleAccess: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  },
}));

describe('sharing.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createInviteToken', () => {
    it('creates a new token when none exists', async () => {
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
        id: 'mod-1', ownerUserId: 'user-1',
      });
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.inviteToken.create as jest.Mock).mockResolvedValue({
        token: 'abc123', expiresAt: new Date('2026-04-10T00:00:00Z'),
      });

      const result = await createInviteToken({ moduleInstanceId: 'mod-1', userId: 'user-1' });

      expect(prisma.inviteToken.create).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
    });

    it('returns the existing unused token without creating a new one', async () => {
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
        id: 'mod-1', ownerUserId: 'user-1',
      });
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({
        token: 'existing-token', expiresAt: new Date('2026-04-10T00:00:00Z'),
      });

      const result = await createInviteToken({ moduleInstanceId: 'mod-1', userId: 'user-1' });

      expect(prisma.inviteToken.create).not.toHaveBeenCalled();
      expect(result.token).toBe('existing-token');
    });

    it('throws MODULE_ACCESS_DENIED when caller is not the owner', async () => {
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        createInviteToken({ moduleInstanceId: 'mod-1', userId: 'wrong-user' })
      ).rejects.toMatchObject({ code: 'MODULE_ACCESS_DENIED' });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npx jest tests/services/sharing.service.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/services/sharing.service'`

- [ ] **Step 3: Create `sharing.service.ts` with `createInviteToken`**

Create `backend/src/services/sharing.service.ts`:

```typescript
import crypto from 'crypto';
import prisma from '../db/prisma';

function createAccessError() {
  return Object.assign(new Error('MODULE_ACCESS_DENIED'), { code: 'MODULE_ACCESS_DENIED', statusCode: 403 });
}

function createSharingError(code: string, message: string, statusCode = 400) {
  return Object.assign(new Error(message), { code, statusCode });
}

async function requireOwner(moduleInstanceId: string, userId: string) {
  const moduleInstance = await prisma.moduleInstance.findFirst({
    where: { id: moduleInstanceId, ownerUserId: userId },
  });
  if (!moduleInstance) throw createAccessError();
  return moduleInstance;
}

export async function createInviteToken(input: { moduleInstanceId: string; userId: string }) {
  await requireOwner(input.moduleInstanceId, input.userId);

  const now = new Date();
  const existing = await prisma.inviteToken.findFirst({
    where: {
      moduleInstanceId: input.moduleInstanceId,
      usedAt: null,
      expiresAt: { gt: now },
    },
  });

  if (existing) {
    return { token: existing.token, expiresAt: existing.expiresAt.toISOString() };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const created = await prisma.inviteToken.create({
    data: {
      token,
      moduleInstanceId: input.moduleInstanceId,
      createdByUserId: input.userId,
      expiresAt,
    },
  });

  return { token: created.token, expiresAt: created.expiresAt.toISOString() };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
npx jest tests/services/sharing.service.test.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/sharing.service.ts backend/tests/services/sharing.service.test.ts
git commit -m "feat(backend): add createInviteToken service with tests"
```

---

## Task 3: `validateInviteToken` Service

**Files:**
- Modify: `backend/src/services/sharing.service.ts`
- Modify: `backend/tests/services/sharing.service.test.ts`

- [ ] **Step 1: Add failing tests for `validateInviteToken`**

Append to the `describe('sharing.service')` block in `backend/tests/services/sharing.service.test.ts`:

```typescript
  describe('validateInviteToken', () => {
    it('returns module info when token is valid', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({
        token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2099-01-01'), usedAt: null,
      });
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
        id: 'mod-1', moduleType: 'menstrual', ownerUserId: 'owner-1',
      });
      (prisma.moduleAccess.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await validateInviteToken({ token: 'tok', userId: 'user-2' });

      expect(result.moduleInstanceId).toBe('mod-1');
      expect(result.accessRole).toBe('VIEWER');
    });

    it('throws INVALID_TOKEN when token does not exist', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(validateInviteToken({ token: 'bad', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    });

    it('throws TOKEN_ALREADY_USED when usedAt is set', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({
        token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2099-01-01'), usedAt: new Date(),
      });

      await expect(validateInviteToken({ token: 'tok', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'TOKEN_ALREADY_USED' });
    });

    it('throws TOKEN_EXPIRED when expiresAt is in the past', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({
        token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2000-01-01'), usedAt: null,
      });

      await expect(validateInviteToken({ token: 'tok', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
    });

    it('throws IS_OWNER when caller owns the module', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({
        token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2099-01-01'), usedAt: null,
      });
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
        id: 'mod-1', moduleType: 'menstrual', ownerUserId: 'owner-1',
      });
      (prisma.moduleAccess.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(validateInviteToken({ token: 'tok', userId: 'owner-1' }))
        .rejects.toMatchObject({ code: 'IS_OWNER' });
    });

    it('throws ALREADY_MEMBER when caller already has active access', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({
        token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2099-01-01'), usedAt: null,
      });
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
        id: 'mod-1', moduleType: 'menstrual', ownerUserId: 'owner-1',
      });
      (prisma.moduleAccess.findFirst as jest.Mock).mockResolvedValue({ id: 'access-1' });

      await expect(validateInviteToken({ token: 'tok', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'ALREADY_MEMBER' });
    });
  });
```

Add `validateInviteToken` to the import at the top of the test file:

```typescript
import { createInviteToken, validateInviteToken } from '../../src/services/sharing.service';
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend
npx jest tests/services/sharing.service.test.ts --no-coverage
```

Expected: FAIL — `validateInviteToken is not a function`

- [ ] **Step 3: Implement `validateInviteToken`**

Append to `backend/src/services/sharing.service.ts`:

```typescript
export async function validateInviteToken(input: { token: string; userId: string }) {
  const record = await prisma.inviteToken.findFirst({ where: { token: input.token } });

  if (!record) throw createSharingError('INVALID_TOKEN', 'Invite token not found', 404);
  if (record.usedAt) throw createSharingError('TOKEN_ALREADY_USED', 'This invite has already been used');
  if (record.expiresAt < new Date()) throw createSharingError('TOKEN_EXPIRED', 'This invite has expired');

  const moduleInstance = await prisma.moduleInstance.findFirst({
    where: { id: record.moduleInstanceId },
  });

  if (moduleInstance!.ownerUserId === input.userId) {
    throw createSharingError('IS_OWNER', 'You are the owner of this module');
  }

  const existingAccess = await prisma.moduleAccess.findFirst({
    where: { moduleInstanceId: record.moduleInstanceId, userId: input.userId, accessStatus: 'ACTIVE' },
  });

  if (existingAccess) throw createSharingError('ALREADY_MEMBER', 'You are already a member of this module');

  return {
    moduleInstanceId: record.moduleInstanceId,
    moduleType: moduleInstance!.moduleType,
    accessRole: 'VIEWER' as const,
    expiresAt: record.expiresAt.toISOString(),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend
npx jest tests/services/sharing.service.test.ts --no-coverage
```

Expected: PASS (all tests in the file)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/sharing.service.ts backend/tests/services/sharing.service.test.ts
git commit -m "feat(backend): add validateInviteToken service with tests"
```

---

## Task 4: `acceptInvite` Service

**Files:**
- Modify: `backend/src/services/sharing.service.ts`
- Modify: `backend/tests/services/sharing.service.test.ts`

- [ ] **Step 1: Add failing tests for `acceptInvite`**

The mock at the top of the test file needs `$transaction`. Replace the existing `jest.mock` block with:

```typescript
jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    moduleInstance: { findFirst: jest.fn(), update: jest.fn() },
    inviteToken: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    moduleAccess: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn((fn: (tx: any) => Promise<any>) => fn({
      inviteToken: { findFirst: jest.fn(), update: jest.fn() },
      moduleAccess: { create: jest.fn() },
      moduleInstance: { update: jest.fn() },
    })),
  },
}));
```

Append to the `describe('sharing.service')` block:

```typescript
  describe('acceptInvite', () => {
    it('creates a ModuleAccess with VIEWER role and marks token as used', async () => {
      const txInviteToken = { findFirst: jest.fn(), update: jest.fn() };
      const txModuleAccess = { create: jest.fn() };
      const txModuleInstance = { update: jest.fn() };
      (prisma.$transaction as jest.Mock).mockImplementation((fn: any) =>
        fn({ inviteToken: txInviteToken, moduleAccess: txModuleAccess, moduleInstance: txModuleInstance })
      );
      txInviteToken.findFirst.mockResolvedValue({
        token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2099-01-01'), usedAt: null,
      });
      txModuleAccess.create.mockResolvedValue({ id: 'access-1' });

      const result = await acceptInvite({ token: 'tok', userId: 'user-2' });

      expect(txModuleAccess.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ role: 'VIEWER', accessStatus: 'ACTIVE', userId: 'user-2' }),
      }));
      expect(txInviteToken.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ usedAt: expect.any(Date), usedByUserId: 'user-2' }),
      }));
      expect(result.accessRole).toBe('VIEWER');
    });

    it('throws TOKEN_EXPIRED when token is already used inside the transaction', async () => {
      const txInviteToken = { findFirst: jest.fn(), update: jest.fn() };
      (prisma.$transaction as jest.Mock).mockImplementation((fn: any) =>
        fn({ inviteToken: txInviteToken, moduleAccess: { create: jest.fn() }, moduleInstance: { update: jest.fn() } })
      );
      txInviteToken.findFirst.mockResolvedValue(null);

      await expect(acceptInvite({ token: 'tok', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    });
  });
```

Add `acceptInvite` to the import at the top of the test file:

```typescript
import { createInviteToken, validateInviteToken, acceptInvite } from '../../src/services/sharing.service';
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend
npx jest tests/services/sharing.service.test.ts --no-coverage
```

Expected: FAIL — `acceptInvite is not a function`

- [ ] **Step 3: Implement `acceptInvite`**

Append to `backend/src/services/sharing.service.ts`:

```typescript
export async function acceptInvite(input: { token: string; userId: string }) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.inviteToken.findFirst({ where: { token: input.token } });

    if (!record) throw createSharingError('INVALID_TOKEN', 'Invite token not found', 404);
    if (record.usedAt) throw createSharingError('TOKEN_ALREADY_USED', 'This invite has already been used');
    if (record.expiresAt < new Date()) throw createSharingError('TOKEN_EXPIRED', 'This invite has expired');

    await tx.moduleAccess.create({
      data: {
        moduleInstanceId: record.moduleInstanceId,
        userId: input.userId,
        role: 'VIEWER',
        accessStatus: 'ACTIVE',
      },
    });

    await tx.inviteToken.update({
      where: { token: input.token },
      data: { usedAt: new Date(), usedByUserId: input.userId },
    });

    await tx.moduleInstance.update({
      where: { id: record.moduleInstanceId },
      data: { sharingStatus: 'SHARED' },
    });

    return { moduleInstanceId: record.moduleInstanceId, accessRole: 'VIEWER' as const };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend
npx jest tests/services/sharing.service.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/sharing.service.ts backend/tests/services/sharing.service.test.ts
git commit -m "feat(backend): add acceptInvite service with transaction and tests"
```

---

## Task 5: `leaveModule` + `getModuleMembers` Services

**Files:**
- Modify: `backend/src/services/sharing.service.ts`
- Modify: `backend/tests/services/sharing.service.test.ts`

- [ ] **Step 1: Add failing tests**

Add `leaveModule` and `getModuleMembers` to the import at the top of the test file:

```typescript
import { createInviteToken, validateInviteToken, acceptInvite, leaveModule, getModuleMembers } from '../../src/services/sharing.service';
```

Append to the `describe('sharing.service')` block:

```typescript
  describe('leaveModule', () => {
    it('revokes the caller access and sets sharingStatus to PRIVATE when no members remain', async () => {
      (prisma.moduleAccess.findFirst as jest.Mock).mockResolvedValue({
        id: 'access-1', userId: 'user-2', role: 'VIEWER', moduleInstanceId: 'mod-1',
      });
      (prisma.moduleAccess.update as jest.Mock).mockResolvedValue({});
      (prisma.moduleAccess.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.moduleInstance.update as jest.Mock).mockResolvedValue({});

      const result = await leaveModule({ moduleInstanceId: 'mod-1', userId: 'user-2' });

      expect(prisma.moduleAccess.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ accessStatus: 'REVOKED', revokedAt: expect.any(Date) }),
      }));
      expect(prisma.moduleInstance.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { sharingStatus: 'PRIVATE' },
      }));
      expect(result.moduleInstanceId).toBe('mod-1');
    });

    it('throws MODULE_ACCESS_DENIED when caller is the owner', async () => {
      (prisma.moduleAccess.findFirst as jest.Mock).mockResolvedValue({
        id: 'access-1', userId: 'owner-1', role: 'OWNER', moduleInstanceId: 'mod-1',
      });

      await expect(leaveModule({ moduleInstanceId: 'mod-1', userId: 'owner-1' }))
        .rejects.toMatchObject({ code: 'MODULE_ACCESS_DENIED' });
    });

    it('throws MODULE_ACCESS_DENIED when caller has no active access', async () => {
      (prisma.moduleAccess.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(leaveModule({ moduleInstanceId: 'mod-1', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'MODULE_ACCESS_DENIED' });
    });
  });

  describe('getModuleMembers', () => {
    it('returns all active members with their roles', async () => {
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'mod-1', ownerUserId: 'owner-1' });
      (prisma.moduleAccess.findMany as jest.Mock).mockResolvedValue([
        { userId: 'owner-1', role: 'OWNER', accessStatus: 'ACTIVE', grantedAt: new Date('2026-04-01') },
        { userId: 'user-2', role: 'VIEWER', accessStatus: 'ACTIVE', grantedAt: new Date('2026-04-09') },
      ]);

      const result = await getModuleMembers({ moduleInstanceId: 'mod-1', userId: 'owner-1' });

      expect(result.members).toHaveLength(2);
      expect(result.members[0].role).toBe('owner');
      expect(result.members[1].role).toBe('viewer');
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend
npx jest tests/services/sharing.service.test.ts --no-coverage
```

Expected: FAIL — `leaveModule is not a function`

- [ ] **Step 3: Implement `leaveModule` and `getModuleMembers`**

Append to `backend/src/services/sharing.service.ts`:

```typescript
export async function leaveModule(input: { moduleInstanceId: string; userId: string }) {
  const access = await prisma.moduleAccess.findFirst({
    where: { moduleInstanceId: input.moduleInstanceId, userId: input.userId, accessStatus: 'ACTIVE' },
  });

  if (!access) throw createAccessError();
  if (access.role === 'OWNER') throw createAccessError();

  await prisma.moduleAccess.update({
    where: { id: access.id },
    data: { accessStatus: 'REVOKED', revokedAt: new Date() },
  });

  const remaining = await prisma.moduleAccess.findMany({
    where: { moduleInstanceId: input.moduleInstanceId, accessStatus: 'ACTIVE', NOT: { role: 'OWNER' } },
  });

  if (remaining.length === 0) {
    await prisma.moduleInstance.update({
      where: { id: input.moduleInstanceId },
      data: { sharingStatus: 'PRIVATE' },
    });
  }

  return { moduleInstanceId: input.moduleInstanceId };
}

function lower(s: string) {
  return s.toLowerCase();
}

export async function getModuleMembers(input: { moduleInstanceId: string; userId: string }) {
  const moduleInstance = await prisma.moduleInstance.findFirst({
    where: {
      id: input.moduleInstanceId,
      OR: [
        { ownerUserId: input.userId },
        { accesses: { some: { userId: input.userId, accessStatus: 'ACTIVE' } } },
      ],
    },
  });

  if (!moduleInstance) throw createAccessError();

  const accesses = await prisma.moduleAccess.findMany({
    where: { moduleInstanceId: input.moduleInstanceId, accessStatus: 'ACTIVE' },
    orderBy: { grantedAt: 'asc' },
  });

  const ownerRow = { userId: moduleInstance.ownerUserId, role: 'owner', accessStatus: 'active', grantedAt: null };
  const partnerRows = accesses.map((a) => ({
    userId: a.userId,
    role: lower(a.role),
    accessStatus: lower(a.accessStatus),
    grantedAt: a.grantedAt.toISOString(),
  }));

  return { members: [ownerRow, ...partnerRows.filter((r) => r.userId !== moduleInstance.ownerUserId)] };
}
```

- [ ] **Step 4: Run all sharing service tests**

```bash
cd backend
npx jest tests/services/sharing.service.test.ts --no-coverage
```

Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/sharing.service.ts backend/tests/services/sharing.service.test.ts
git commit -m "feat(backend): add leaveModule and getModuleMembers services with tests"
```

---

## Task 6: Update `getModuleAccessState` to Return Caller's Role

**Files:**
- Modify: `backend/src/services/query.service.ts`
- Modify: `backend/tests/services/query.service.test.ts`

- [ ] **Step 1: Add a failing test**

Open `backend/tests/services/query.service.test.ts`, find the `getModuleAccessState` describe block and add:

```typescript
it('returns the caller role as viewer when caller has VIEWER access', async () => {
  (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
    id: 'mod-1', ownerUserId: 'owner-1',
  });
  (prisma.moduleAccess.findMany as jest.Mock).mockResolvedValue([
    { userId: 'user-2', role: 'VIEWER', accessStatus: 'ACTIVE' },
  ]);

  const result = await getModuleAccessState({ moduleInstanceId: 'mod-1', userId: 'user-2' });

  expect(result.callerRole).toBe('viewer');
});

it('returns the caller role as owner when caller is the module owner', async () => {
  (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
    id: 'mod-1', ownerUserId: 'owner-1',
  });
  (prisma.moduleAccess.findMany as jest.Mock).mockResolvedValue([]);

  const result = await getModuleAccessState({ moduleInstanceId: 'mod-1', userId: 'owner-1' });

  expect(result.callerRole).toBe('owner');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend
npx jest tests/services/query.service.test.ts --no-coverage
```

Expected: FAIL — `callerRole` is undefined

- [ ] **Step 3: Update `getModuleAccessState` in `query.service.ts`**

Find the `getModuleAccessState` function and update its return value:

```typescript
export async function getModuleAccessState(input: AccessInput) {
  const moduleInstance = await requireAccess(input.moduleInstanceId, input.userId);

  const accesses = await prisma.moduleAccess.findMany({
    where: {
      moduleInstanceId: input.moduleInstanceId,
      accessStatus: 'ACTIVE',
    },
  });

  const activeMembers = accesses
    .filter((a) => a.accessStatus === 'ACTIVE')
    .map((a) => ({
      userId: a.userId,
      role: lower(a.role),
      accessStatus: lower(a.accessStatus),
    }));

  const callerAccess = accesses.find((a) => a.userId === input.userId);
  const callerRole = callerAccess ? lower(callerAccess.role) : 'owner';

  const activePartners = activeMembers.filter((m) => m.role !== 'owner');

  return {
    moduleInstanceId: moduleInstance.id,
    sharingStatus: activePartners.length ? 'shared' : 'private',
    ownerUserId: moduleInstance.ownerUserId,
    callerRole,
    activePartners,
  };
}
```

- [ ] **Step 4: Run tests**

```bash
cd backend
npx jest tests/services/query.service.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/query.service.ts backend/tests/services/query.service.test.ts
git commit -m "feat(backend): expose callerRole in getModuleAccessState"
```

---

## Task 7: Controller + Routes

**Files:**
- Create: `backend/src/controllers/sharing.controller.ts`
- Modify: `backend/src/routes/commands.ts`
- Modify: `backend/src/routes/queries.ts`

- [ ] **Step 1: Create `sharing.controller.ts`**

Create `backend/src/controllers/sharing.controller.ts`:

```typescript
import { Request, Response } from 'express';
import {
  createInviteToken,
  validateInviteToken,
  acceptInvite,
  leaveModule,
  getModuleMembers,
} from '../services/sharing.service';

function handleError(res: Response, error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && 'statusCode' in error) {
    const err = error as { code: string; statusCode: number; message?: string };
    return res.status(err.statusCode).json({
      ok: false, data: null,
      error: { code: err.code, message: err.message ?? 'Operation failed' },
    });
  }
  return res.status(500).json({
    ok: false, data: null,
    error: { code: 'SHARING_ERROR', message: error instanceof Error ? error.message : 'Operation failed' },
  });
}

export async function createInviteTokenHandler(req: Request, res: Response) {
  try {
    const result = await createInviteToken({ ...req.body, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) { handleError(res, error); }
}

export async function validateInviteTokenHandler(req: Request, res: Response) {
  try {
    const result = await validateInviteToken({ token: req.query.token as string, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) { handleError(res, error); }
}

export async function acceptInviteHandler(req: Request, res: Response) {
  try {
    const result = await acceptInvite({ ...req.body, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) { handleError(res, error); }
}

export async function leaveModuleHandler(req: Request, res: Response) {
  try {
    const result = await leaveModule({ ...req.body, userId: req.user.id });
    res.json({ ok: true, data: result, error: null });
  } catch (error) { handleError(res, error); }
}

export async function getModuleMembersHandler(req: Request, res: Response) {
  try {
    const result = await getModuleMembers({
      moduleInstanceId: req.query.moduleInstanceId as string,
      userId: req.user.id,
    });
    res.json({ ok: true, data: result, error: null });
  } catch (error) { handleError(res, error); }
}
```

- [ ] **Step 2: Wire into `commands.ts`**

Add to `backend/src/routes/commands.ts`:

```typescript
import {
  createInviteTokenHandler,
  acceptInviteHandler,
  leaveModuleHandler,
} from '../controllers/sharing.controller';

// Add these routes after the existing ones:
router.post('/createInviteToken', createInviteTokenHandler);
router.post('/acceptInvite', acceptInviteHandler);
router.post('/leaveModule', leaveModuleHandler);
```

- [ ] **Step 3: Wire into `queries.ts`**

Add to `backend/src/routes/queries.ts`:

```typescript
import {
  validateInviteTokenHandler,
  getModuleMembersHandler,
} from '../controllers/sharing.controller';

// Add these routes after the existing ones:
router.get('/validateInviteToken', validateInviteTokenHandler);
router.get('/getModuleMembers', getModuleMembersHandler);
```

- [ ] **Step 4: Build to verify no TypeScript errors**

```bash
cd backend
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/sharing.controller.ts backend/src/routes/commands.ts backend/src/routes/queries.ts
git commit -m "feat(backend): wire sharing controller and routes"
```

---

## Task 8: Integration Tests for Sharing Endpoints

**Files:**
- Create: `backend/tests/integration/sharing.integration.test.ts`

- [ ] **Step 1: Write integration tests**

Create `backend/tests/integration/sharing.integration.test.ts`:

```typescript
import request from 'supertest';
import app from '../../src/app';
import { findOrCreateUser } from '../../src/services/auth.service';
import {
  createInviteToken,
  validateInviteToken,
  acceptInvite,
  leaveModule,
  getModuleMembers,
} from '../../src/services/sharing.service';

jest.mock('../../src/services/auth.service');
jest.mock('../../src/services/sharing.service');

describe('Sharing Integration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POST /api/commands/createInviteToken returns token', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (createInviteToken as jest.Mock).mockResolvedValue({ token: 'abc', expiresAt: '2026-04-10T00:00:00.000Z' });

    const res = await request(app)
      .post('/api/commands/createInviteToken')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'mod-1' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, data: { token: 'abc', expiresAt: '2026-04-10T00:00:00.000Z' }, error: null });
  });

  it('GET /api/queries/validateInviteToken returns module info', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-2', openid: 'openid-2' });
    (validateInviteToken as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'mod-1', moduleType: 'menstrual', accessRole: 'VIEWER', expiresAt: '2026-04-10T00:00:00.000Z',
    });

    const res = await request(app)
      .get('/api/queries/validateInviteToken?token=abc')
      .set('x-wx-openid', 'openid-2');

    expect(res.status).toBe(200);
    expect(res.body.data.accessRole).toBe('VIEWER');
  });

  it('GET /api/queries/validateInviteToken returns 404 for invalid token', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-2', openid: 'openid-2' });
    (validateInviteToken as jest.Mock).mockRejectedValue(
      Object.assign(new Error('not found'), { code: 'INVALID_TOKEN', statusCode: 404 })
    );

    const res = await request(app)
      .get('/api/queries/validateInviteToken?token=bad')
      .set('x-wx-openid', 'openid-2');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('POST /api/commands/acceptInvite returns VIEWER role', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-2', openid: 'openid-2' });
    (acceptInvite as jest.Mock).mockResolvedValue({ moduleInstanceId: 'mod-1', accessRole: 'VIEWER' });

    const res = await request(app)
      .post('/api/commands/acceptInvite')
      .set('x-wx-openid', 'openid-2')
      .send({ token: 'abc' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessRole).toBe('VIEWER');
  });

  it('POST /api/commands/leaveModule returns moduleInstanceId', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-2', openid: 'openid-2' });
    (leaveModule as jest.Mock).mockResolvedValue({ moduleInstanceId: 'mod-1' });

    const res = await request(app)
      .post('/api/commands/leaveModule')
      .set('x-wx-openid', 'openid-2')
      .send({ moduleInstanceId: 'mod-1' });

    expect(res.status).toBe(200);
    expect(res.body.data.moduleInstanceId).toBe('mod-1');
  });

  it('GET /api/queries/getModuleMembers returns members list', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (getModuleMembers as jest.Mock).mockResolvedValue({
      members: [
        { userId: 'user-1', role: 'owner', accessStatus: 'active', grantedAt: null },
        { userId: 'user-2', role: 'viewer', accessStatus: 'active', grantedAt: '2026-04-09T00:00:00.000Z' },
      ],
    });

    const res = await request(app)
      .get('/api/queries/getModuleMembers?moduleInstanceId=mod-1')
      .set('x-wx-openid', 'openid-1');

    expect(res.status).toBe(200);
    expect(res.body.data.members).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
cd backend
npx jest tests/integration/sharing.integration.test.ts --no-coverage
```

Expected: PASS (6 tests)

- [ ] **Step 3: Run full backend test suite**

```bash
cd backend
npx jest --no-coverage
```

Expected: all existing tests still pass plus the new ones

- [ ] **Step 4: Commit**

```bash
git add backend/tests/integration/sharing.integration.test.ts
git commit -m "test(backend): add sharing integration tests"
```

---

## Task 9: Frontend Sharing Service

**Files:**
- Create: `frontend/services/sharing/sharing-command-service.js`
- Create: `frontend/services/sharing/sharing-query-service.js`

- [ ] **Step 1: Create `sharing-command-service.js`**

Create `frontend/services/sharing/sharing-command-service.js`:

```javascript
import { cloudRequest } from '../cloud-request.js';

async function commandEnvelope({ openid, path, data }) {
	const response = await cloudRequest({
		path,
		method: 'POST',
		data,
		headers: { 'x-wx-openid': openid },
	});
	if (response.statusCode !== 200 || !response.data?.ok) {
		const err = response.data?.error;
		const e = new Error(err?.message || `Command failed: ${path}`);
		e.code = err?.code || 'UNKNOWN';
		throw e;
	}
	return response.data.data;
}

export async function createInviteToken({ openid, moduleInstanceId }) {
	return commandEnvelope({
		openid,
		path: '/api/commands/createInviteToken',
		data: { moduleInstanceId },
	});
}

export async function acceptInvite({ openid, token }) {
	return commandEnvelope({
		openid,
		path: '/api/commands/acceptInvite',
		data: { token },
	});
}

export async function leaveModule({ openid, moduleInstanceId }) {
	return commandEnvelope({
		openid,
		path: '/api/commands/leaveModule',
		data: { moduleInstanceId },
	});
}
```

- [ ] **Step 2: Create `sharing-query-service.js`**

Create `frontend/services/sharing/sharing-query-service.js`:

```javascript
import { cloudRequest } from '../cloud-request.js';

async function queryEnvelope({ openid, path, params }) {
	const qs = new URLSearchParams({ ...params, _ts: Date.now() }).toString();
	const response = await cloudRequest({
		path: `${path}?${qs}`,
		method: 'GET',
		headers: { 'x-wx-openid': openid },
	});
	if (response.statusCode !== 200 || !response.data?.ok) {
		const err = response.data?.error;
		const e = new Error(err?.message || `Query failed: ${path}`);
		e.code = err?.code || 'UNKNOWN';
		throw e;
	}
	return response.data.data;
}

export async function validateInviteToken({ openid, token }) {
	return queryEnvelope({
		openid,
		path: '/api/queries/validateInviteToken',
		params: { token },
	});
}

export async function getModuleMembers({ openid, moduleInstanceId }) {
	return queryEnvelope({
		openid,
		path: '/api/queries/getModuleMembers',
		params: { moduleInstanceId },
	});
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/services/sharing/
git commit -m "feat(frontend): add sharing command and query service modules"
```

---

## Task 10: Join Landing Page

**Files:**
- Create: `frontend/pages/join/index.vue`
- Modify: `frontend/pages.json`

- [ ] **Step 1: Register page in `pages.json`**

Add to the `pages` array in `frontend/pages.json`:

```json
{
  "path": "pages/join/index",
  "style": {
    "navigationBarTitleText": "加入共享"
  }
}
```

- [ ] **Step 2: Create `pages/join/index.vue`**

Create `frontend/pages/join/index.vue`:

```vue
<template>
	<view class="join-page u-page-shell">
		<view v-if="state === 'loading'" class="join-page__loading">
			<text class="join-page__loading-text">验证中…</text>
		</view>

		<view v-else-if="state === 'valid'" class="join-page__confirm">
			<text class="join-page__module-name">月经记录</text>
			<text class="join-page__permission-label">你将以只读方式加入</text>
			<text class="join-page__permission-hint">加入后可以查看所有数据，但无法编辑。</text>
			<button class="join-page__join-btn" :disabled="joining" @tap="handleJoin">
				{{ joining ? '加入中…' : '加入' }}
			</button>
		</view>

		<view v-else class="join-page__error">
			<text class="join-page__error-message">{{ errorMessage }}</text>
			<button class="join-page__home-btn" @tap="handleGoHome">回到首页</button>
		</view>
	</view>
</template>

<script>
import { validateInviteToken, } from '../../services/sharing/sharing-query-service.js';
import { acceptInvite } from '../../services/sharing/sharing-command-service.js';
import { DEFAULT_MENSTRUAL_HOME_CONTEXT } from '../../services/menstrual/home-contract-service.js';

const ERROR_MESSAGES = {
	INVALID_TOKEN: '邀请链接无效，请联系对方重新发送。',
	TOKEN_ALREADY_USED: '这个邀请链接已经被使用过了。',
	TOKEN_EXPIRED: '邀请链接已过期（有效期24小时），请联系对方重新发送。',
	ALREADY_MEMBER: '你已经是这个模块的成员了。',
	IS_OWNER: '这是你自己的模块。',
};

export default {
	data() {
		return {
			state: 'loading',   // 'loading' | 'valid' | 'error'
			token: null,
			openid: null,
			moduleInstanceId: null,
			errorMessage: '',
			joining: false,
		};
	},
	onLoad(options) {
		const d = (v) => (v && v !== 'undefined' ? v : null);
		this.token = d(options.token);
		this.openid = d(options.openid) || DEFAULT_MENSTRUAL_HOME_CONTEXT.openid;

		if (!this.token) {
			this.state = 'error';
			this.errorMessage = ERROR_MESSAGES.INVALID_TOKEN;
			return;
		}
		this.validate();
	},
	methods: {
		async validate() {
			try {
				const data = await validateInviteToken({ openid: this.openid, token: this.token });
				this.moduleInstanceId = data.moduleInstanceId;
				this.state = 'valid';
			} catch (err) {
				this.state = 'error';
				this.errorMessage = ERROR_MESSAGES[err.code] || '出现了未知错误，请稍后重试。';
			}
		},
		async handleJoin() {
			this.joining = true;
			try {
				await acceptInvite({ openid: this.openid, token: this.token });
				uni.redirectTo({
					url: `/pages/menstrual/home?openid=${this.openid}&moduleInstanceId=${this.moduleInstanceId}`,
				});
			} catch (err) {
				this.state = 'error';
				this.errorMessage = ERROR_MESSAGES[err.code] || '加入失败，请稍后重试。';
			} finally {
				this.joining = false;
			}
		},
		handleGoHome() {
			uni.switchTab({ url: '/pages/index/index' });
		},
	},
};
</script>

<style lang="scss">
.join-page {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40px 32px;
	min-height: 60vh;

	&__loading-text {
		font-size: 16px;
		color: #6b7280;
	}

	&__module-name {
		font-size: 22px;
		font-weight: 600;
		margin-bottom: 12px;
	}

	&__permission-label {
		font-size: 16px;
		color: #374151;
		margin-bottom: 8px;
	}

	&__permission-hint {
		font-size: 13px;
		color: #6b7280;
		margin-bottom: 32px;
		text-align: center;
	}

	&__join-btn {
		background: #b45309;
		color: #fff;
		border-radius: 10px;
		padding: 12px 40px;
		font-size: 16px;
	}

	&__error-message {
		font-size: 15px;
		color: #6b7280;
		text-align: center;
		margin-bottom: 24px;
	}

	&__home-btn {
		background: #f3f4f6;
		color: #374151;
		border-radius: 10px;
		padding: 10px 32px;
		font-size: 15px;
	}
}
</style>
```

- [ ] **Step 3: Verify page is reachable**

Run the dev server or open in HBuilderX and navigate to `pages/join/index?token=test`. Expected: page loads and shows the loading state briefly then the invalid token error (since "test" is not a real token against a running backend).

- [ ] **Step 4: Commit**

```bash
git add frontend/pages/join/index.vue frontend/pages.json
git commit -m "feat(frontend): add join landing page and register in pages.json"
```

---

## Task 11: Read-Only Mode in Menstrual Home Page

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Modify: `frontend/services/menstrual/module-shell-service.js` (or wherever `getModuleAccessState` is called)

- [ ] **Step 1: Thread `callerRole` through `home-contract-service.js`**

Open `frontend/services/menstrual/home-contract-service.js`. In `loadMenstrualHomePageModel`, add a `getModuleAccessState` call to the parallel fetch block. The function already imports `queryEnvelope` and uses `resolved.openid`/`moduleInstanceId`.

Find the `Promise.all` block (which currently fetches calendarWindow, dayDetail, singleDayPeriodAction, moduleSettings) and add an access state fetch:

```javascript
const [{ calendarWindow }, dayDetail, singleDayPeriodAction, moduleSettings, accessState] = await Promise.all([
  loadMenstrualCalendarWindow({ ...resolved, focusDate, viewMode }),
  loadMenstrualDayDetail({ ...resolved, activeDate }),
  getSingleDayPeriodAction({
    apiBaseUrl: resolved.apiBaseUrl,
    openid: resolved.openid,
    moduleInstanceId: resolved.moduleInstanceId,
    date: activeDate
  }),
  loadMenstrualModuleSettings(resolved),
  queryEnvelope({
    apiBaseUrl: resolved.apiBaseUrl,
    openid: resolved.openid,
    path: '/api/queries/getModuleAccessState',
    data: { moduleInstanceId: resolved.moduleInstanceId }
  })
]);
```

Then add `callerRole` to the `raw` object that the function returns:

```javascript
raw: {
  homeView,
  moduleSettings,
  dayDetail,
  calendarWindow,
  singleDayPeriodAction,
  focusDate,
  callerRole: accessState?.callerRole || 'owner',   // add this line
  // ... rest of existing raw fields
}
```

- [ ] **Step 2: Expose `userRole` in `home.vue` data**

In `frontend/pages/menstrual/home.vue`, find the `data()` function and add `userRole`:

```javascript
data() {
  return {
    // ... all existing fields ...
    userRole: 'owner',
  };
},
```

- [ ] **Step 3: Set `userRole` after initial load**

In `home.vue`, find where `rawContracts` is assigned after loading (search for `this.rawContracts =`). Immediately after that assignment, add:

```javascript
this.userRole = this.rawContracts?.callerRole || 'owner';
```

- [ ] **Step 4: Add read-only badge and hide write controls**

In `home.vue` template, locate the hero header area (around line 3, the `menstrual-home__hero` block). Add the badge inside it, after the sharing chip:

```vue
<view v-if="userRole === 'viewer'" class="menstrual-home__readonly-badge">
  <text class="menstrual-home__readonly-label">只读</text>
</view>
```

Find the batch actions container at line 44 of the template:

```vue
<view class="menstrual-home__batch-actions">
```

Add `v-if="userRole !== 'viewer'"` to it:

```vue
<view v-if="userRole !== 'viewer'" class="menstrual-home__batch-actions">
```

Find the `SelectedDatePanel` component usage (search for `@clear-attributes`) and wrap it with:

```vue
<template v-if="userRole !== 'viewer'">
  <!-- existing SelectedDatePanel component -->
</template>
```

- [ ] **Step 5: Add share button for OWNER**

In the hero header area of `home.vue`, add a share button visible only to the owner:

```vue
<view v-if="userRole === 'owner'" class="menstrual-home__share-btn" @tap="handleShareTap">
  <text>邀请</text>
</view>
```

Add the `handleShareTap` method:

```javascript
async handleShareTap() {
  try {
    const { token } = await createInviteToken({
      openid: this.contractContext.openid,
      moduleInstanceId: this.contractContext.moduleInstanceId,
    });
    wx.shareAppMessage({
      title: '邀请你查看月经记录',
      path: `pages/join/index?token=${token}&openid=${this.contractContext.openid}`,
    });
  } catch (err) {
    uni.showToast({ title: '生成邀请失败', icon: 'none' });
  }
},
```

Add the import at the top of the `<script>` section:

```javascript
import { createInviteToken } from '../../services/sharing/sharing-command-service.js';
```

- [ ] **Step 6: Add SCSS for new elements**

In `home.vue` `<style>`, add:

```scss
.menstrual-home__readonly-badge {
  display: inline-flex;
  align-items: center;
  background: #fef3c7;
  border-radius: 6px;
  padding: 2px 8px;
  margin-bottom: 8px;
}

.menstrual-home__readonly-label {
  font-size: 12px;
  color: #92400e;
  font-weight: 600;
}

.menstrual-home__share-btn {
  padding: 4px 12px;
  background: #faf7f2;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/pages/menstrual/home.vue frontend/services/menstrual/module-shell-service.js
git commit -m "feat(frontend): add read-only mode and share button to menstrual home"
```

---

## Task 12: Leave Module UI

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`

- [ ] **Step 1: Add "退出共享" button for VIEWER**

In `home.vue` template, in the hero area or settings area, add:

```vue
<view v-if="userRole === 'viewer'" class="menstrual-home__leave-btn" @tap="handleLeaveTap">
  <text>退出共享</text>
</view>
```

- [ ] **Step 2: Add `handleLeaveTap` method**

```javascript
async handleLeaveTap() {
  const confirmed = await new Promise((resolve) => {
    uni.showModal({
      title: '退出共享',
      content: '退出后将无法继续查看这个模块的数据。',
      confirmText: '退出',
      confirmColor: '#dc2626',
      success: (res) => resolve(res.confirm),
    });
  });
  if (!confirmed) return;

  try {
    await leaveModule({
      openid: this.contractContext.openid,
      moduleInstanceId: this.contractContext.moduleInstanceId,
    });
    uni.showToast({ title: '已退出共享', icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 1000);
  } catch (err) {
    uni.showToast({ title: '退出失败', icon: 'none' });
  }
},
```

Add the `leaveModule` import:

```javascript
import { createInviteToken, leaveModule } from '../../services/sharing/sharing-command-service.js';
```

- [ ] **Step 3: Add SCSS**

```scss
.menstrual-home__leave-btn {
  padding: 4px 12px;
  background: #fee2e2;
  border-radius: 8px;
  font-size: 13px;
  color: #dc2626;
}
```

- [ ] **Step 4: Run full backend test suite one final time**

```bash
cd backend
npx jest --no-coverage
```

Expected: all tests pass

- [ ] **Step 5: Final commit**

```bash
git add frontend/pages/menstrual/home.vue
git commit -m "feat(frontend): add leave-module UI for VIEWER role"
```
