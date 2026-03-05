---
name: senior-dev-wisdom
description: Senior developer wisdom and best practices for production-ready software development. Use when building, reviewing, or refactoring software systems to ensure: (1) Complete business logic and user experience (业务闭环), (2) Robust data flow and state management (数据流转), (3) Scalable and maintainable architecture (架构设计), (4) Production readiness including error handling, logging, monitoring, and deployment. This skill provides seasoned engineering insights to avoid common pitfalls and build systems that work reliably in real-world production environments.
---

# Senior Developer Wisdom

This skill encapsulates decades of engineering experience to help build production-ready, robust software systems. It focuses on the critical aspects that distinguish working prototypes from production-grade systems.

## Core Principles

### Think Like a Senior Engineer

Senior engineers don't just make code work—they consider:
- **What happens when things fail?** (error handling, edge cases)
- **What happens at scale?** (performance, bottlenecks)
- **What happens over time?** (maintenance, evolution, technical debt)
- **What did I forget?** (business gaps, data inconsistencies, security issues)
- **How will the next person understand this?** (readability, documentation)

## Key Areas

### 1. Business Closure (业务闭环)

**Complete User Experience**: A feature isn't done until the entire user journey is complete.

#### Checklist
- [ ] **Entry points**: How do users start this flow? (buttons, links, API endpoints)
- [ ] **Happy path**: Does the main use case work end-to-end?
- [ ] **Error cases**: What happens when things go wrong? (validation errors, network failures, data not found)
- [ ] **Edge cases**: Empty states, maximum limits, concurrent operations
- [ ] **Feedback**: Does the user know what's happening? (loading states, success/error messages, progress indicators)
- [ ] **Exit points**: How do users complete or abandon this flow?
- [ ] **Undo/Cancel**: Can users reverse actions or cancel in-progress operations?
- [ ] **Permissions**: Who should be allowed to do what? (authorization, access control)

#### Common Gaps to Avoid
- Creating data but no way to view/edit/delete it
- API endpoints that return data but no UI uses them
- Error messages that don't help users recover
- Features that work in dev but fail in production (missing environment variables, missing indexes)

### 2. Data Flow (数据流转)

**Trace Data Movement**: Understand how data flows through your system and ensure it's correct at every step.

#### Key Questions
- **Where does data come from?** (user input, database, external API, message queue)
- **Where does it go?** (database, cache, search index, analytics, external service)
- **What transformations happen?** (validation, sanitization, enrichment, formatting)
- **What can fail?** (database down, API timeout, invalid data format)
- **Is data consistent?** (race conditions, partial failures, eventual consistency)

#### Patterns to Follow

**Request-Response Flow:**
```
Client → API Gateway → Service Layer → Database
                ↓           ↓
            Validation  Business Logic
                ↓           ↓
           Error Handling  Data Transformation
```

**Async Event Flow:**
```
Event Producer → Message Queue → Event Consumer → Side Effects
                          ↓
                    Dead Letter Queue (for failures)
                          ↓
                    Retry Logic (with backoff)
```

#### Common Pitfalls
- Missing validation at boundaries (API inputs, user inputs)
- Silent failures (errors logged but not surfaced to users)
- Partial updates (one database write succeeds, another fails)
- Race conditions (concurrent updates causing data loss)
- Missing transactions (data inconsistency)
- No retry logic (transient failures cause permanent issues)

### 3. Architecture Design (架构设计)

**Build for Change**: Design systems that are easy to understand, modify, and extend.

#### Layered Architecture

**Presentation Layer** (UI/API):
- Handles user interaction and request/response formatting
- No business logic—just delegates to service layer

**Service Layer** (Business Logic):
- Orchestrates business operations
- Coordinates between domain objects and external services
- Transaction boundaries live here

**Data Access Layer** (Persistence):
- Database queries, cache operations
- No business logic—just data storage/retrieval

**Example - Create Order:**
```typescript
// ❌ Bad: Business logic in controller
app.post('/orders', (req) => {
  const order = { ...req.body, status: 'pending', createdAt: Date.now() };
  await db.orders.insert(order);
  await emailService.send(req.body.email);
  return order;
});

// ✅ Good: Controller delegates to service
app.post('/orders', async (req) => {
  return orderService.createOrder(req.body); // All logic in service
});

// Service layer handles everything
class OrderService {
  async createOrder(data) {
    // Validation
    // Business rules
    // Database transaction
    // External service calls
    // Event publishing
    // Error handling
  }
}
```

#### Key Design Principles

**Separation of Concerns**: Each layer has a single responsibility
- UI doesn't query database directly
- Services don't format HTTP responses
- Data layer doesn't send emails

**Dependency Inversion**: Depend on abstractions, not concrete implementations
```typescript
// ✅ Good: Depends on interface
class OrderService {
  constructor(private paymentProcessor: PaymentProcessor) {}
}

// ❌ Bad: Depends on concrete implementation
class OrderService {
  constructor(private stripePayment: StripePayment) {}
}
```

**Fail Gracefully**: Build resilience from the start
- Circuit breakers for external services
- Timeouts on all network calls
- Fallback/default values when possible
- Retry logic with exponential backoff
- Dead letter queues for failed messages

### 4. Production Readiness

#### Error Handling

**Handle Errors at Every Layer:**

1. **Input Validation**: Reject invalid data immediately
   ```typescript
   function createOrder(data: CreateOrderRequest) {
     if (!data.email?.includes('@')) {
       throw new ValidationError('Invalid email');
     }
     // ...
   }
   ```

2. **Business Logic Errors**: Expected failures (insufficient stock, user not found)
   ```typescript
   async function purchaseItem(itemId: string, userId: string) {
     const item = await db.items.findById(itemId);
     if (!item) {
       throw new NotFoundError('Item not found');
     }
     if (item.stock <= 0) {
       throw new BusinessError('Item out of stock');
     }
     // ...
   }
   ```

3. **System Errors**: Unexpected failures (database down, API timeout)
   ```typescript
   async function callExternalAPI(url: string) {
     try {
       return await fetch(url, { timeout: 5000 });
     } catch (error) {
       logger.error('API call failed', { url, error });
       throw new ServiceUnavailableError('External service unavailable');
     }
   }
   ```

4. **Global Error Handler**: Catch all errors and return appropriate responses
   ```typescript
   app.use((error, req, res, next) => {
     if (error instanceof ValidationError) {
       return res.status(400).json({ error: error.message });
     }
     if (error instanceof BusinessError) {
       return res.status(400).json({ error: error.message });
     }
     logger.error('Unexpected error', { error });
     res.status(500).json({ error: 'Internal server error' });
   });
   ```

#### Logging Strategy

**Log What Matters:**
- **Request context**: Request ID, user ID, timestamp
- **Business events**: Order created, payment succeeded, user registered
- **Errors**: Full error stack trace + context (what were we trying to do?)
- **Performance**: Slow queries, slow API calls (threshold-based)

**Structured Logging:**
```typescript
logger.info('Order created', {
  orderId: order.id,
  userId: user.id,
  amount: order.total,
  paymentMethod: order.paymentMethod,
  duration: ms  // How long it took
});
```

**Don't Log:**
- Sensitive data (passwords, credit cards, personal info)
- Everything (log noise makes debugging harder)
- Redundant info (don't log the same event multiple times)

#### Monitoring & Observability

**Key Metrics:**
- **Business metrics**: Orders per minute, active users, conversion rate
- **Performance metrics**: API response times, database query times
- **Error metrics**: Error rate by endpoint, error types
- **Resource metrics**: CPU, memory, disk, network

**Alert on What Matters:**
- Error rate > 1% for any endpoint
- Response time P95 > 1s for critical endpoints
- Database connection pool exhausted
- Queue depth > threshold
- Disk space < 20%

#### Deployment Considerations

**Environment Variables:**
- Never hardcode config (API keys, database URLs, feature flags)
- Use environment-specific config files
- Validate required env vars on startup

**Database Migrations:**
- Version-controlled schema changes
- Rollback plans for every migration
- Test migrations on staging first
- Handle data migrations carefully (can be slow)

**Feature Flags:**
- Deploy code dark (disabled) before enabling
- Gradual rollout (1% → 10% → 50% → 100%)
- Kill switch to disable features immediately

**Health Checks:**
```typescript
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalAPI: await checkExternalAPI()
  };
  const healthy = Object.values(checks).every(c => c.ok);
  res.status(healthy ? 200 : 503).json(checks);
});
```

## Review Checklist

When reviewing code or architecture, ask:

### Business Logic
- [ ] All user journeys complete (create, read, update, delete)
- [ ] Error cases handled with user-friendly messages
- [ ] Edge cases covered (empty states, limits, concurrency)
- [ ] Permissions/authorization checked
- [ ] Validation at all entry points

### Data Flow
- [ ] Data sources and destinations clear
- [ ] Transformations explicit and testable
- [ ] Failures handled (retry, rollback, dead letter queue)
- [ ] Data consistency guaranteed (transactions, idempotency)
- [ ] Race conditions prevented

### Architecture
- [ ] Clear layer separation (presentation, service, data)
- [ ] Dependencies inverted (depend on abstractions)
- [ ] Single responsibility per component
- [ ] Easy to test (mock external dependencies)
- [ ] Easy to modify (loose coupling)

### Production Readiness
- [ ] Errors handled at every layer
- [ ] Structured logging (request ID, context)
- [ ] Monitoring (metrics, alerts, dashboards)
- [ ] Config externalized (environment variables)
- [ ] Health checks implemented
- [ ] Deployment strategy defined

## Common Anti-Patterns to Avoid

### 1. God Objects
```typescript
// ❌ Bad: Does everything
class UserService {
  createUser() { }
  validateEmail() { }
  sendEmail() { }
  logToDatabase() { }
  chargeCreditCard() { }
}
```

### 2. Tight Coupling
```typescript
// ❌ Bad: Hard to test, hard to change
class OrderService {
  async createOrder(data) {
    await db.insert('orders', data);
    await stripe.charge(data.amount); // Direct dependency
    await sendgrid.send(data.email);  // Direct dependency
  }
}

// ✅ Good: Injected dependencies, easy to mock
class OrderService {
  constructor(
    private db: Database,
    private payment: PaymentProcessor,
    private email: EmailService
  ) {}
}
```

### 3. Silent Failures
```typescript
// ❌ Bad: Error lost
try {
  await processOrder(order);
} catch (error) {
  console.log(error); // Logged but not surfaced
  return { success: true }; // Lies to caller
}

// ✅ Good: Error handled and communicated
try {
  await processOrder(order);
  return { success: true };
} catch (error) {
  logger.error('Order processing failed', { orderId: order.id, error });
  return { success: false, error: error.message };
}
```

### 4. Missing Transactions
```typescript
// ❌ Bad: Data inconsistency if second insert fails
async function transferMoney(from, to, amount) {
  await db.accounts.update(from, { balance: from.balance - amount });
  await db.accounts.update(to, { balance: to.balance + amount });
}

// ✅ Good: Atomic transaction
async function transferMoney(from, to, amount) {
  await db.transaction(async (tx) => {
    await tx.accounts.update(from, { balance: from.balance - amount });
    await tx.accounts.update(to, { balance: to.balance + amount });
  });
}
```

## Usage Examples

**Example 1: Reviewing API Design**
```
User: "I'm building a payment API, can you review it?"
→ Use this skill to check:
  - Business closure: What happens on payment failure? Refunds? Partial payments?
  - Data flow: Is payment status stored? How do we handle race conditions?
  - Architecture: Is payment processing separate from order creation?
  - Production: Are transactions used? Is payment idempotent? What if Stripe is down?
```

**Example 2: Refactoring Code**
```
User: "This function is 500 lines and hard to maintain"
→ Use this skill to guide refactoring:
  - Identify separate concerns (validation, business logic, data access)
  - Extract smaller, focused functions
  - Inject dependencies instead of hardcoding
  - Add error handling at each layer
```

**Example 3: Architecture Review**
```
User: "We're building a real-time notification system"
→ Use this skill to consider:
  - Business closure: What if user is offline? Delivery guarantees?
  - Data flow: How do we ensure no duplicate notifications?
  - Architecture: Message queue? Websockets? Polling?
  - Production: How do we monitor delivery rates? What if queue backs up?
```

## References

For more detailed guidance on specific topics, see:
- [references/workflows.md](references/workflows.md) - Common engineering workflows
- [references/architecture-patterns.md](references/architecture-patterns.md) - Architectural patterns and when to use them
- [references/error-handling.md](references/error-handling.md) - Comprehensive error handling strategies
