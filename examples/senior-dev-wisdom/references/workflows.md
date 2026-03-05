# Common Engineering Workflows

This document provides detailed workflows for common engineering tasks, applying the senior developer wisdom principles.

## 1. Feature Development Workflow

### Phase 1: Understanding Requirements

**Ask Critical Questions:**
- What problem are we solving? For whom?
- What does "done" look like? (acceptance criteria)
- What are the edge cases?
- How will we measure success?
- What could go wrong? (failure modes)

**Document:**
```markdown
## Feature: User Password Reset

### User Story
As a user, I want to reset my password so I can regain access if I forget it.

### Acceptance Criteria
- [ ] User can request password reset via email
- [ ] User receives email with reset link
- [ ] User can set new password via link
- [ ] Link expires after 1 hour
- [ ] Old password is invalidated
- [ ] User is logged in after reset

### Edge Cases
- User requests multiple resets (use latest token)
- Link already used (invalidate after use)
- Non-existent email (don't reveal this, pretend it worked)
- Link expired (show friendly error, offer resend)

### Failure Modes
- Email service down → Queue for retry
- Database down → Return 503, try again later
- Token generation fails → Log error, return 500
```

### Phase 2: Design Data Flow

```
User clicks "Forgot Password"
    ↓
POST /auth/password-reset (email)
    ↓
Validate email format
    ↓
Generate reset token (UUID, expires in 1h)
    ↓
Store token in database (user_id, token, expires_at)
    ↓
Queue email job (user_id, token)
    ↓
Return response: "If email exists, check your inbox"
    ↓
[Async] Email worker sends email
```

**Identify Transaction Boundaries:**
```typescript
// Transaction 1: Create token
async function requestPasswordReset(email: string) {
  const user = await db.users.findByEmail(email);
  if (!user) {
    // Don't reveal user existence, return success anyway
    return { success: true };
  }

  const token = generateResetToken();
  await db.transaction(async (tx) => {
    // Invalidate existing tokens
    await tx.passwordResetTokens.deleteByUserId(user.id);
    // Create new token
    await tx.passwordResetTokens.insert({
      userId: user.id,
      token,
      expiresAt: Date.now() + HOUR
    });
  });

  // Queue email (outside transaction for speed)
  await queue.email.send('password-reset', { userId: user.id, token });

  return { success: true };
}

// Transaction 2: Reset password
async function resetPassword(token: string, newPassword: string) {
  const resetToken = await db.passwordResetTokens.findByToken(token);
  if (!resetToken || resetToken.expiresAt < Date.now()) {
    throw new InvalidTokenError('Token expired or invalid');
  }

  await db.transaction(async (tx) => {
    // Update password
    await tx.users.update(resetToken.userId, {
      password: await hash(newPassword)
    });
    // Invalidate token
    await tx.passwordResetTokens.delete(resetToken.id);
    // Invalidate all sessions (force re-login)
    await tx.sessions.deleteByUserId(resetToken.userId);
  });

  return { success: true };
}
```

### Phase 3: Implement Layer by Layer

**1. Data Access Layer:**
```typescript
// repositories/password-reset.repository.ts
class PasswordResetRepository {
  async findByToken(token: string) {
    return db.passwordResetTokens
      .where('token', token)
      .where('expires_at', '>', Date.now())
      .first();
  }

  async deleteByUserId(userId: string) {
    return db.passwordResetTokens.where('user_id', userId).delete();
  }
}
```

**2. Service Layer:**
```typescript
// services/password-reset.service.ts
class PasswordResetService {
  constructor(
    private repo: PasswordResetRepository,
    private userRepo: UserRepository,
    private emailQueue: Queue
  ) {}

  async requestReset(email: string) {
    // Implementation from Phase 2
  }

  async reset(token: string, newPassword: string) {
    // Implementation from Phase 2
  }
}
```

**3. Presentation Layer:**
```typescript
// controllers/password-reset.controller.ts
router.post('/password-reset', async (req, res) => {
  try {
    await passwordResetService.requestReset(req.body.email);
    res.json({ message: 'If email exists, check your inbox' });
  } catch (error) {
    logger.error('Password reset request failed', { email: req.body.email, error });
    // Return generic error to avoid leaking info
    res.status(500).json({ error: 'Request failed. Try again later.' });
  }
});
```

### Phase 4: Test Edge Cases

```typescript
describe('Password Reset', () => {
  it('should handle non-existent email', async () => {
    const result = await requestReset('nonexistent@example.com');
    expect(result.success).toBe(true); // Don't reveal user existence
  });

  it('should invalidate old tokens when requesting new one', async () => {
    await requestReset('user@example.com');
    await requestReset('user@example.com'); // Second request
    // First token should be invalid
    await expect(reset(firstToken, 'newpass')).rejects.toThrow();
  });

  it('should expire token after 1 hour', async () => {
    const { token } = await requestReset('user@example.com');
    // Fast-forward time
    vi.advanceTimersByTime(61 * 60 * 1000);
    await expect(reset(token, 'newpass')).rejects.toThrow();
  });

  it('should invalidate all sessions after reset', async () => {
    const session = await createSession(userId);
    await reset(token, 'newpass');
    const valid = await validateSession(session.token);
    expect(valid).toBe(false);
  });
});
```

### Phase 5: Production Readiness Checklist

```markdown
## Implementation Checklist

### Business Logic
- [x] Request reset flow
- [x] Reset password flow
- [x] Token expiration
- [x] Invalid token handling
- [x] Session invalidation
- [x] Rate limiting (prevent email spam)

### Data Flow
- [x] Transaction for token creation
- [x] Transaction for password update
- [x] Email queued asynchronously
- [x] Database indexes on token, userId, expiresAt

### Error Handling
- [x] Invalid token → clear error message
- [x] Expired token → clear error, offer resend
- [x] Database error → logged, returns 500
- [x] Email service down → queued for retry

### Logging
- [x] Password reset requested (email, timestamp)
- [x] Password reset completed (userId, timestamp)
- [x] Token validation failures (token, reason)
- [x] Email send failures (userId, error)

### Monitoring
- [x] Metric: password_reset_requests_total
- [x] Metric: password_reset_completed_total
- [x] Metric: password_reset_failed_total (by reason)
- [x] Alert: High failure rate (>5%)
- [x] Alert: Email queue backup (>1000 pending)

### Security
- [x] Token is cryptographically random (UUID v4)
- [x] Password hashed before storage
- [x] Token expires in reasonable time (1 hour)
- [x] Rate limiting on reset request (5 per hour per email)
- [x] Don't reveal user existence
```

## 2. Code Review Workflow

### Step 1: Understand the Change

**Read the PR description first:**
- What problem does this solve?
- What's the implementation approach?
- Are there any trade-offs or caveats?

**Review the changes holistically:**
- Look at the full diff first, not line-by-line
- Understand the overall structure
- Identify the main components changed

### Step 2: Business Logic Review

```markdown
## Business Closure Checklist

- [ ] Is the user journey complete?
  - All entry points handled?
  - All exit points handled?
  - Can users recover from errors?

- [ ] Edge cases covered?
  - Empty/null values
  - Maximum limits
  - Concurrent operations
  - Invalid input

- [ ] Permissions checked?
  - Who can perform this action?
  - What happens if unauthorized?

- [ ] Data consistency?
  - Are all related updates atomic?
  - What happens if partial failure?
```

**Example Review Comments:**

```typescript
// ❌ What to catch:
// Missing error handling
async function updateUser(userId, data) {
  await db.users.update(userId, data);
  // What if user doesn't exist?
  // What if data is invalid?
}

// ✅ Suggest:
async function updateUser(userId, data) {
  const user = await db.users.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  const validated = validateUserUpdate(data);
  return await db.users.update(userId, validated);
}
```

### Step 3: Data Flow Review

```markdown
## Data Flow Checklist

- [ ] Data sources clear?
  - Where does input come from?
  - Is it validated at the boundary?

- [ ] Data transformations explicit?
  - Can we see how data changes?
  - Are transformations testable?

- [ ] Failure modes handled?
  - What if database is down?
  - What if external API times out?
  - What if queue is full?

- [ ] Race conditions prevented?
  - Are updates atomic?
  - Are transactions used correctly?
  - Is there locking where needed?
```

**Example Review Comments:**

```typescript
// ❌ What to catch:
// Race condition - double spend
async function purchaseItem(userId, itemId) {
  const item = await db.items.findById(itemId);
  if (item.stock > 0) {
    // What if two purchases happen simultaneously?
    await db.items.update(itemId, { stock: item.stock - 1 });
  }
}

// ✅ Suggest:
// Use atomic decrement
async function purchaseItem(userId, itemId) {
  const result = await db.items
    .where('id', itemId)
    .where('stock', '>', 0)
    .decrement('stock', 1);
  if (result === 0) {
    throw new OutOfStockError();
  }
  // ... continue with purchase
}
```

### Step 4: Architecture Review

```markdown
## Architecture Checklist

- [ ] Layer separation maintained?
  - No business logic in controllers?
  - No database queries in services?
  - No HTML formatting in data layer?

- [ ] Dependencies appropriate?
  - High-level modules don't depend on low-level?
  - Depend on abstractions, not concretions?

- [ ] Single responsibility?
  - Each function/class does one thing?
  - Easy to test in isolation?

- [ ] Easy to modify?
  - Loose coupling?
  - Clear interfaces?
```

**Example Review Comments:**

```typescript
// ❌ What to catch:
// Business logic in controller
app.post('/orders', async (req, res) => {
  const order = {
    ...req.body,
    status: 'pending',
    createdAt: Date.now(),
    total: req.body.items.reduce((sum, item) => sum + item.price, 0)
  };
  await db.orders.insert(order);
  res.json(order);
});

// ✅ Suggest:
// Controller delegates to service
app.post('/orders', async (req, res) => {
  const order = await orderService.createOrder(req.body);
  res.json(order);
});

// Service contains business logic
class OrderService {
  async createOrder(data: CreateOrderDTO) {
    // Validate
    // Calculate total
    // Check inventory
    // Create order in transaction
    // Publish event
  }
}
```

### Step 5: Production Readiness Review

```markdown
## Production Readiness Checklist

- [ ] Error handling?
  - All errors caught and handled?
  - Error messages helpful?
  - Errors logged with context?

- [ ] Logging?
  - Key events logged?
  - Request ID included?
  - No sensitive data logged?

- [ ] Performance?
  - Database queries optimized?
  - N+1 queries avoided?
  - Caching used where appropriate?

- [ ] Security?
  - Input validated?
  - SQL injection prevented?
  - XSS prevented?
  - Authorization checked?
```

## 3. Troubleshooting Production Issues

### Step 1: Define the Problem

**Gather Information:**
```markdown
## Issue Template

### What's broken?
- [ ] Users can't log in
- [ ] API responses are slow
- [ ] Data is missing
- [ ] Other: _____

### Impact?
- How many users affected?
- What functionality is broken?
- Is there a workaround?

### When did it start?
- Time of first occurrence
- Was there a recent deployment?
- Any recent config changes?

### Error messages?
- What do users see?
- What's in the logs?
- What errors are returned?
```

### Step 2: Check Obvious Things First

```markdown
## Quick Checks (in order)

1. **Is the service running?**
   - Check process monitor: `ps aux | grep service-name`
   - Check logs: Are there startup errors?

2. **Are dependencies up?**
   - Database: `pg_isprod`, `redis-cli ping`
   - External APIs: Can we reach them?

3. **Is it just one server or all?**
   - Check multiple instances if load-balanced
   - Check different regions if multi-region

4. **Recent changes?**
   - Check deployment logs
   - Check config changes
   - Check schema migrations

5. **Resource exhaustion?**
   - CPU: `top`
   - Memory: `free -h`
   - Disk: `df -h`
   - Network: `netstat -an`
```

### Step 3: Dive Deeper

**Use the Data Flow:**
```
User Issue
    ↓
Check API Gateway (request received?)
    ↓
Check Application (request processed?)
    ↓
Check Database (query executed?)
    ↓
Check External Services (API called?)
```

**Example: Debugging Slow API**

```typescript
// 1. Add timing logs
async function getOrder(orderId: string) {
  const start = Date.now();
  logger.debug('getOrder start', { orderId });

  const order = await db.orders.findById(orderId);
  logger.debug('db query complete', { duration: Date.now() - start });

  const items = await db.items.findByOrderId(orderId);
  logger.debug('items query complete', { duration: Date.now() - start });

  return { order, items };
}

// 2. Check logs
// getOrder start: 0ms
// db query complete: 50ms
// items query complete: 5000ms  ← Problem here!

// 3. Investigate
// - Check database: Is there an index on order_id?
// - Check query: EXPLAIN shows full table scan
// - Fix: Add index
```

### Step 4: Rollback or Fix?

**Decision Tree:**
```markdown
## Rollback Criteria

Rollback IMMEDIATELY if:
- Data corruption or data loss
- Security vulnerability exposed
- Users can't access critical functionality
- Performance severely degraded (>10x slowdown)

Fix in place if:
- Minor edge case bug
- Affects small percentage of users
- Workaround available
- Rollback would cause more disruption

## Rollback Process
1. Verify backup is available
2. Revert code deployment
3. Run any rollback migrations (reverse schema changes)
4. Clear caches (Redis, CDN)
5. Monitor health checks
6. Verify functionality restored
```

### Step 5: Prevent Recurrence

```markdown
## Post-Incident Review

### Root Cause Analysis
- What happened?
- Why did it happen?
- What processes failed?

### Action Items
- [ ] Fix the bug
- [ ] Add monitoring/alerting
- [ ] Update runbooks
- [ ] Improve testing
- [ ] Process changes

### Prevention
- Can we add integration tests?
- Can we add better validation?
- Can we add circuit breakers?
- Can we add performance tests?
```
