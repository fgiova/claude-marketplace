---
name: fastify-testing
description: |
  Activate when writing or discussing tests for Fastify applications using node-tap.
  Trigger keywords: fastify test, tap test, app.inject, route test, plugin test,
  integration test fastify, unit test fastify, t.test, t.equal, t.same,
  test helper, test fixture, fastify mock, fastify testing, beforeEach,
  afterEach, mockAgent, undici mock, prisma test, t.beforeEach, t.afterEach,
  inject, test context, t.plan, t.rejects, t.match.
version: 0.1.0
---

# Fastify Testing Expert

This skill provides testing conventions and patterns for Fastify applications using node-tap, covering unit tests of helper functions and route handlers.

> **Note**: For container-based test infrastructure (Testcontainers, Ryuk reaper, `test-env.json`, `localtest.ts`), see the **tap-testcontainers** skill.

## Project Context

The service uses:
- **Testing Framework**: Tap (node-tap)
- **Database**: Prisma (with driver adapters)
- **Web Framework**: Fastify
- **Test Structure**: Unit tests for helper functions and route handlers
- **HTTP Mocking**: Undici MockAgent for external HTTP calls

## Testing Strategy

- **Unit tests** for individual plugins and routes
- **Integration tests** for end-to-end API flows
- **Mocking external calls** with `undici`'s `MockAgent`
- **Test organization** with `tap` for structure and assertions
- **Coverage reports** with `c8` for code coverage analysis

## TypeScript Type Setup

All test files must follow this exact type structure:

```typescript
import "../../helpers/localtest.js";
import { PrismaClient } from "../../../src/prisma/client/index.js";
import type { BuiltPlugins } from "@tapjs/test";
import { randomUUID } from "node:crypto";
import fastify, { type FastifyInstance } from "fastify";
import { type BaseOpts, type Test, test } from "tap";
import { /* functions to test */ } from "../../../src/[module].js";

type TestContext = {
	app: FastifyInstance;
	prisma: PrismaClient;
};

type TestWithContext = Omit<
	Test<BuiltPlugins, BaseOpts> & BuiltPlugins,
	"context"
> & { context: TestContext };
```

### Key Points:
- Always import `BuiltPlugins`, `BaseOpts`, and `Test` from `@tapjs/test`
- Import `PrismaClient` from the generated path (e.g. `../../../src/prisma/client/index.js`), not from `@prisma/client`
- Define `TestContext` with the exact properties needed (typically `app` and `prisma`)
- Define `TestWithContext` using the Omit pattern to properly type the context
- Import `localtest.js` helper at the top for test environment setup
- Always import `randomUUID` from `node:crypto` for generating unique test IDs

## Test Structure

### Main Test Suite Setup

Prisma connection is shared across all tests (`before`/`after`), while the Fastify app is recreated per test (`beforeEach`/`afterEach`):

```typescript
test("Module name", async (t: TestWithContext) => {
	let prisma: PrismaClient;

	t.before(async () => {
		const adapter = /* your driver adapter setup */;
		prisma = new PrismaClient({ adapter });
	});

	t.after(async () => {
		await prisma.$disconnect();
	});

	t.beforeEach(async (t) => {
		const app = fastify();
		app.decorate("prisma", prisma);

		t.context = {
			app,
			prisma,
		};
	});

	t.afterEach(async (t: TestWithContext) => {
		await t.context.app.close();
	});

	// Individual tests here...
});
```

### Important Details:
- **Prisma lifecycle**: Create in `t.before()`, disconnect in `t.after()` — one connection for the entire suite
- **Fastify lifecycle**: Create in `t.beforeEach()`, close in `t.afterEach()` — fresh instance per test
- **beforeEach**: Must be `async`, receives untyped `t`, creates fresh Fastify instance
- **afterEach**: Must be `async`, typed with `TestWithContext`, closes the app
- **Decorate pattern**: Use `app.decorate("prisma", prisma)` to make Prisma available on Fastify instance

## Test Naming Convention

### For helper/function tests:
Follow the pattern: `"functionName - should describe behavior"`

```typescript
// ✅ Good
"findById - should return user when exists"
"search - should return empty array for non-existing term"
"create - should validate required fields"
"update - should merge partial data"

// ❌ Bad
"should search user by name"  // Missing function name
"test search"  // Not descriptive
"search works"  // Not descriptive
```

### For route tests:
Follow the pattern: `"METHOD /path - should describe behavior"`

```typescript
// ✅ Good
"GET /users/:id - should return 200 with user data"
"POST /users - should return 201 on success"
"GET /users/:id - should return 404 when not found"
"POST /orders - should return 422 for invalid payload"

// ❌ Bad
"POST /v1 success"  // Missing "should", not descriptive
"should return 200"  // Missing route info
```

### Naming Rules:
1. Start with the function name or `METHOD /path` being tested
2. Add " - should " separator
3. Describe the specific behavior or scenario
4. Use action verbs: "find", "retrieve", "filter", "handle", "return"
5. Be specific about the test case (e.g., "when not found", "for invalid input")

## Individual Test Structure

```typescript
t.test(
	"functionName - should do something",
	async (t: TestWithContext) => {
		const { app } = t.context;

		// 1. Setup test data
		const inputValue = "TestValue";

		// 2. Execute function
		const result = await functionToTest(app, inputValue);

		// 3. Assert results
		t.ok(result, "Result should exist");
		t.equal(result.property, inputValue, "Property should match");

		// 4. Verify relationships
		t.ok(result.relatedEntity, "Should have related entity");
	},
);
```

### Test Structure Rules:
1. Always wrap with `t.test()` with descriptive name
2. Always use `async (t: TestWithContext)` for the test function
3. Always destructure context: `const { app } = t.context` (or `{ app, prisma }` if needed)
4. Organize test in clear sections: setup → execute → assert
5. Use descriptive assertion messages

## Using `t.plan()`

Use `t.plan(n)` to ensure all expected assertions run, especially useful in async flows with callbacks or conditional branches:

```typescript
t.test(
	"processItems - should emit event for each item",
	async (t: TestWithContext) => {
		t.plan(3); // Expect exactly 3 assertions

		const { app } = t.context;
		const items = ["a", "b", "c"];

		for (const item of items) {
			app.emit("process", item);
			t.pass(`Processed ${item}`);
		}
	},
);
```

**When to use `t.plan()`:**
- Tests with callbacks that might not fire
- Tests with conditional logic where you want to guarantee a branch was taken
- Event-driven tests where you expect a specific number of events

**When NOT to use `t.plan()`:**
- Simple linear async/await tests — the implicit plan is sufficient

## Testing Patterns by Function Type

### Search Functions (Returns Array)

Test cases to include:
1. **Success case**: Find by name/search term
2. **Empty result**: Non-existing search term
3. **Filter variations**: Test each optional filter parameter
4. **Relationship verification**: Check included relations

```typescript
t.test(
	"search - should find items by name",
	async (t: TestWithContext) => {
		const { app } = t.context;
		const searchTerm = "TestItem";

		const results = await search(app, searchTerm);

		t.ok(results.length > 0, "Results should be found");
		t.equal(results[0].name, searchTerm, "Name should match");
		t.ok(results[0].category, "Should have category relation");
	},
);

t.test(
	"search - should return empty array for non-existing item",
	async (t: TestWithContext) => {
		const { app } = t.context;
		const searchTerm = "NonExistingItem";

		const results = await search(app, searchTerm);

		t.ok(Array.isArray(results), "Result should be an array");
		t.equal(results.length, 0, "No results should be found");
	},
);

t.test(
	"search - should filter by active status",
	async (t: TestWithContext) => {
		const { app } = t.context;
		const searchTerm = "TestItem";

		const results = await search(app, searchTerm, { active: true });

		t.ok(results.length > 0, "Results should be found");
		t.ok(results.every((r) => r.active), "All results should be active");
	},
);
```

### Get Single Item Functions (Returns Object)

Test cases to include:
1. **Success case**: Retrieve by identifier
2. **Property verification**: Check all returned properties
3. **Filter variations**: Test optional filters
4. **Relationship verification**: Check all included relations

```typescript
t.test(
	"getById - should retrieve item by ID",
	async (t: TestWithContext) => {
		const { app } = t.context;
		const itemId = "known-id";

		const item = await getById(app, itemId);

		t.equal(item.id, itemId, "ID should match");
		t.ok(item.name, "Should have a name");
		t.ok(item.category, "Should have category relation");
		t.ok(item.owner, "Should have owner relation");
	},
);
```

### Get Multiple Items Functions (Returns Array by ID/Code)

```typescript
t.test(
	"getByCategory - should retrieve items by category code",
	async (t: TestWithContext) => {
		const { app } = t.context;
		const categoryCode = "electronics";

		const items = await getByCategory(app, categoryCode);

		t.ok(Array.isArray(items), "Result should be an array");
		t.ok(items.length > 0, "Items should be found");
		t.ok(
			items.every((item) => item.category?.code === categoryCode),
			"All items should belong to the same category",
		);
	},
);
```

## Testing Error Responses

Always test error cases explicitly, verifying both status code and response body:

```typescript
t.test(
	"GET /users/:id - should return 404 when not found",
	async (t: TestWithContext) => {
		const { app } = t.context;

		const response = await app.inject({
			method: "GET",
			url: `/users/${randomUUID()}`,
		});

		t.equal(response.statusCode, 404);
		t.match(response.json(), { message: /not found/i });
	},
);

t.test(
	"POST /users - should return 400 for invalid payload",
	async (t: TestWithContext) => {
		const { app } = t.context;

		const response = await app.inject({
			method: "POST",
			url: "/users",
			payload: { /* missing required fields */ },
		});

		t.equal(response.statusCode, 400);
		t.ok(response.json().message, "Should have error message");
	},
);

t.test(
	"POST /users - should return 409 for duplicate email",
	async (t: TestWithContext) => {
		const { app, prisma } = t.context;
		const email = `duplicate-${randomUUID()}@test.com`;

		// Create existing user
		await prisma.user.create({
			data: { id: randomUUID(), email, name: "Existing" },
		});

		const response = await app.inject({
			method: "POST",
			url: "/users",
			payload: { email, name: "New User" },
		});

		t.equal(response.statusCode, 409);
	},
);
```

## Special Cases

### Tests Requiring Database Queries

When you need to query the database first to get IDs or verify data:

```typescript
t.test(
	"getOrdersByUserId - should retrieve orders for user",
	async (t: TestWithContext) => {
		const { app, prisma } = t.context;

		// Query database to get a valid ID
		const user = await prisma.user.findFirst({
			where: { email: "test@example.com" },
		});

		if (!user) {
			t.fail("Test user not found in database");
			return;
		}

		const orders = await getOrdersByUserId(app, user.id);

		t.ok(Array.isArray(orders), "Result should be an array");
		t.ok(orders.length > 0, "Orders should be found");
		t.equal(orders[0].userId, user.id, "User ID should match");
	},
);
```

### Tests Requiring External HTTP Calls

When the function makes external HTTP requests, use `undici`'s `MockAgent` to mock responses. **Always save and restore the original dispatcher.**

```typescript
import "../../helpers/localtest.js";
import { randomUUID } from "node:crypto";
import type { BuiltPlugins } from "@tapjs/test";
import fastify, { type FastifyInstance } from "fastify";
import { type BaseOpts, type Test, test } from "tap";
import {
	type Dispatcher,
	MockAgent,
	getGlobalDispatcher,
	setGlobalDispatcher,
} from "undici";
import config from "../../../../src/config.js";
import route from "../../../../src/routes/index.js";

type TestContext = {
	app: FastifyInstance;
	mockPool: ReturnType<MockAgent["get"]>;
	mockAgent: MockAgent;
	originalDispatcher: Dispatcher;
};

type TestWithContext = Omit<
	Test<BuiltPlugins, BaseOpts> & BuiltPlugins,
	"context"
> & { context: TestContext };

test("POST /orders - external service integration", async (t: TestWithContext) => {
	t.beforeEach(async (t: TestWithContext) => {
		const originalDispatcher = getGlobalDispatcher();
		const mockAgent = new MockAgent();
		const mockPool = mockAgent.get("https://payment.example.com");
		setGlobalDispatcher(mockAgent);

		const app = fastify();
		app.decorate("config", {
			...config,
			urls: {
				...config.urls,
				paymentUrl: "https://payment.example.com/api",
			},
		});
		await app.register(route);
		await app.ready();

		t.context = {
			app,
			mockPool,
			mockAgent,
			originalDispatcher,
		};
	});

	t.afterEach(async (t: TestWithContext) => {
		t.context.mockAgent.close();
		setGlobalDispatcher(t.context.originalDispatcher);
		await t.context.app.close();
	});

	t.test("POST /orders - should return 200 on success", async (t: TestWithContext) => {
		const orderId = randomUUID();

		t.context.mockPool.intercept({
			method: "POST",
			path: "/api/charge",
			body: JSON.stringify({ orderId }),
			headers: { "Content-Type": "application/json" },
		}).reply(200, { success: true, transactionId: randomUUID() });

		const response = await t.context.app.inject({
			method: "POST",
			url: "/orders",
			payload: { orderId },
		});

		t.equal(response.statusCode, 200);
		const body = response.json();
		t.ok(body.transactionId, "Should have transaction ID");
	});

	t.test("POST /orders - should return 502 on remote service failure", async (t: TestWithContext) => {
		const orderId = randomUUID();

		t.context.mockPool.intercept({
			method: "POST",
			path: "/api/charge",
		}).reply(500, { error: "Internal Server Error" });

		const response = await t.context.app.inject({
			method: "POST",
			url: "/orders",
			payload: { orderId },
		});

		t.equal(response.statusCode, 502);
		t.match(response.json(), { message: /remote service/i });
	});
});
```

### Custom Response Structures

When functions return custom structures (not direct Prisma results):

```typescript
t.test(
	"getProductDetails - should return product with variants",
	async (t: TestWithContext) => {
		const { app } = t.context;
		const productCode = "PRD-001";

		const result = await getProductDetails(app, productCode);

		t.equal(result.code, productCode, "Product code should match");
		t.ok(Array.isArray(result.variants), "Variants should be an array");
		t.ok(result.variants.length > 0, "Variants should be found");

		const variant = result.variants[0];
		t.ok(variant.name, "Variant should have a name");
		t.ok(variant.price, "Variant should have a price");
	},
);
```

## Assertion Best Practices

### Use Descriptive Messages

```typescript
// ✅ Good
t.ok(result.category, "Product should have a category");
t.equal(result.code, expectedCode, "Product code should match");

// ❌ Bad
t.ok(result.category);
t.equal(result.code, expectedCode);
```

### Test Multiple Aspects

For each test, verify:
1. Main functionality (the item was found/created/updated)
2. Key properties (IDs, codes, names match)
3. Relationships (related entities are present)
4. Filters work correctly (active, status, type, etc.)

### Use Appropriate Assertions

- `t.ok(value, msg)`: Truthy check (existence, non-empty)
- `t.notOk(value, msg)`: Falsy check (null, undefined, false, 0)
- `t.equal(a, b, msg)`: Strict equality (`===`)
- `t.same(a, b, msg)`: Deep equality (objects, arrays)
- `t.match(obj, pattern, msg)`: Partial/pattern match — object contains subset, strings match regex
- `t.has(obj, subset, msg)`: Object contains at least the given properties
- `t.type(value, type, msg)`: Type checking (`t.type(result, 'object')`)
- `t.rejects(promise, expectedError, msg)`: Promise should reject with specific error
- `t.throws(fn, expectedError, msg)`: Function should throw
- `t.fail(msg)`: Explicit failure with message

### `t.match()` vs `t.same()` vs `t.has()`

```typescript
const result = { id: "abc", name: "Test", createdAt: new Date(), extra: true };

// t.same — exact deep equality, all properties must match
t.same(result, { id: "abc", name: "Test", createdAt: new Date(), extra: true });

// t.match — partial match, only checks provided properties, supports regex
t.match(result, { id: "abc", name: /test/i });

// t.has — object has at least these properties (like match but stricter on values)
t.has(result, { id: "abc", name: "Test" });
```

### Testing Rejections and Throws

```typescript
t.test(
	"delete - should reject when item is referenced",
	async (t: TestWithContext) => {
		const { app } = t.context;

		t.rejects(
			() => deleteItem(app, "referenced-id"),
			{ message: /cannot delete/i },
			"Should reject with cannot delete message",
		);
	},
);
```

## Common Patterns Summary

### Import Pattern
```typescript
import "../../helpers/localtest.js";
import { PrismaClient } from "../../../src/prisma/client/index.js";
import type { BuiltPlugins } from "@tapjs/test";
import { randomUUID } from "node:crypto";
import fastify, { type FastifyInstance } from "fastify";
import { type BaseOpts, type Test, test } from "tap";
```

### Type Definition Pattern
```typescript
type TestContext = {
	app: FastifyInstance;
	prisma: PrismaClient;
};

type TestWithContext = Omit<
	Test<BuiltPlugins, BaseOpts> & BuiltPlugins,
	"context"
> & { context: TestContext };
```

### Setup/Teardown Pattern
```typescript
test("Module name", async (t: TestWithContext) => {
	let prisma: PrismaClient;

	t.before(async () => {
		const adapter = /* your driver adapter setup */;
		prisma = new PrismaClient({ adapter });
	});

	t.after(async () => {
		await prisma.$disconnect();
	});

	t.beforeEach(async (t) => {
		const app = fastify();
		app.decorate("prisma", prisma);
		t.context = { app, prisma };
	});

	t.afterEach(async (t: TestWithContext) => {
		await t.context.app.close();
	});

	// tests...
});
```

### Test Naming Pattern
```typescript
// Helper functions
t.test("functionName - should describe specific behavior", async (t: TestWithContext) => { ... });

// Route handlers
t.test("GET /resource/:id - should return 200 with data", async (t: TestWithContext) => { ... });
```

## Coverage Goals

For each module, ensure tests cover:
- All exported functions
- Success cases with valid data
- Edge cases (empty results, not found)
- All optional parameters/filters
- Relationship verification
- Error handling (4xx and 5xx responses)

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/unit/users/user.ts

# Run tests with coverage
npm run test:coverage

# Run in debug mode (single test, no timeout)
npm run test:debug
```

> For local execution with testcontainers (`TEST_LOCAL`, `SKIP_TEST_*`), see the **tap-testcontainers** skill.

## Database Data Management in Tests

This section describes how to manage database data in tests. Following these rules ensures tests are isolated, readable, and maintainable.

### Core Principles

1. **No DB cleanup needed**: The test database container is destroyed automatically by tap/testcontainers at the end of the test run. Do NOT write cleanup logic in `afterEach`.

2. **Use `randomUUID()` for unique IDs**: Always generate unique identifiers to avoid conflicts between tests running in parallel or sequentially.

3. **Separate shared vs specific data**: Put only truly shared data in `beforeEach`, everything else goes in individual tests.

### What Goes in `before` (Prisma Connection)

Create the Prisma connection once for the entire suite:

```typescript
t.before(async () => {
	const adapter = /* your driver adapter setup */;
	prisma = new PrismaClient({ adapter });
});
```

### What Goes in `beforeEach` (Shared Test Data)

Insert ONLY data that is **required by ALL tests** in the suite:

```typescript
t.beforeEach(async (t) => {
	const tenantId = randomUUID();

	// Create shared entity that ALL tests need
	await prisma.tenant.create({
		data: {
			id: tenantId,
			name: "Test Tenant",
			domain: `https://test-${tenantId}.example.com`,
			isActive: true,
		},
	});

	const app = fastify();
	app.decorate("prisma", prisma);
	await app.register(route);
	await app.ready();

	t.context = {
		app,
		prisma,
		tenantId,
	};
});
```

**Examples of shared data:**
- `tenantId` - if all tests operate within a tenant context
- Base user - if all tests require an authenticated user
- Configuration entities - if all tests need specific settings

### What Goes in Individual Tests

Insert data **specific to that test case** directly in the test:

```typescript
t.test(
	"GET /:id - should return customer when exists",
	async (t: TestWithContext) => {
		const { app, prisma, tenantId } = t.context;

		const customer = await prisma.customer.create({
			data: {
				id: randomUUID(),
				tenantId,
				email: `test-${randomUUID()}@example.com`,
				name: "Test User",
				addresses: {
					create: {
						id: randomUUID(),
						tenantId,
						street: "Via Roma",
						number: "1",
						city: "Roma",
						zipCode: "00100",
					},
				},
			},
		});

		const response = await app.inject({
			method: "GET",
			url: `/${customer.id}`,
			headers: { "x-tenant-id": tenantId },
		});

		t.equal(response.statusCode, 200);
	},
);
```

### What Goes in `after` and `afterEach`

```typescript
// after: disconnect Prisma (once)
t.after(async () => {
	await prisma.$disconnect();
});

// afterEach: close Fastify app only, NO database cleanup
t.afterEach(async (t: TestWithContext) => {
	await t.context.app.close();
});
```

### Pattern Example: Token Verification

```typescript
test("Token verification", async (t: TestWithContext) => {
	let prisma: PrismaClient;

	t.before(async () => {
		const adapter = /* your driver adapter setup */;
		prisma = new PrismaClient({ adapter });
	});

	t.after(async () => {
		await prisma.$disconnect();
	});

	t.beforeEach(async (t) => {
		const tenantId = randomUUID();

		await prisma.tenant.create({
			data: {
				id: tenantId,
				name: "Test Tenant",
				domain: `https://test-${tenantId}.example.com`,
				isActive: true,
			},
		});

		const app = fastify();
		app.decorate("prisma", prisma);
		await app.register(route);
		await app.ready();

		t.context = { app, prisma, tenantId };
	});

	t.afterEach(async (t: TestWithContext) => {
		await t.context.app.close();
	});

	t.test("GET /verify/:token - should return 200 for valid token", async (t: TestWithContext) => {
		const { app, prisma, tenantId } = t.context;
		const token = randomUUID();

		await prisma.token.create({
			data: { tenantId, token },
		});

		const response = await app.inject({
			method: "GET",
			url: `/verify/${token}`,
		});

		t.equal(response.statusCode, 200);
	});

	t.test("GET /verify/:token - should return 401 for non-existent token", async (t: TestWithContext) => {
		const { app } = t.context;

		const response = await app.inject({
			method: "GET",
			url: `/verify/${randomUUID()}`,
		});

		t.equal(response.statusCode, 401);
	});

	t.test("GET /verify/:token - should return 401 for revoked token", async (t: TestWithContext) => {
		const { app, prisma, tenantId } = t.context;
		const token = randomUUID();

		await prisma.token.create({
			data: { tenantId, token },
		});
		await prisma.revokedToken.create({
			data: { token },
		});

		const response = await app.inject({
			method: "GET",
			url: `/verify/${token}`,
		});

		t.equal(response.statusCode, 401);
	});

	t.test("GET /verify/:token - should return 401 for inactive tenant", async (t: TestWithContext) => {
		const { app, prisma } = t.context;
		const inactiveTenantId = randomUUID();
		const token = randomUUID();

		await prisma.tenant.create({
			data: {
				id: inactiveTenantId,
				name: "Inactive Tenant",
				domain: `https://inactive-${inactiveTenantId}.example.com`,
				isActive: false,
			},
		});
		await prisma.token.create({
			data: { tenantId: inactiveTenantId, token },
		});

		const response = await app.inject({
			method: "GET",
			url: `/verify/${token}`,
		});

		t.equal(response.statusCode, 401);
	});
});
```

### Decision Guide: beforeEach vs Individual Test

| Scenario | Where to Put Data |
|----------|------------------|
| Entity needed by ALL tests | `beforeEach` |
| Entity needed by SOME tests | Individual tests |
| Entity with specific state (active/inactive) | Individual tests |
| Entity representing error case | Individual tests |
| Entity from different tenant | Individual tests |
| Related entities (token, address, etc.) | Individual tests |

### Anti-Patterns to Avoid

```typescript
// ❌ BAD: Creating all possible data variations in beforeEach
t.beforeEach(async (t) => {
	const activeTenant = await prisma.tenant.create({ data: { isActive: true, ... } });
	const inactiveTenant = await prisma.tenant.create({ data: { isActive: false, ... } });
	const validToken = await prisma.token.create({ ... });
	const revokedToken = await prisma.token.create({ ... });
});

// ❌ BAD: Cleaning up database in afterEach
t.afterEach(async (t: TestWithContext) => {
	await prisma.token.deleteMany({});
	await prisma.tenant.deleteMany({});
});

// ❌ BAD: Using hardcoded IDs
const user = await prisma.user.create({
	data: { id: "fixed-id-123" }, // Will conflict between tests
});

// ❌ BAD: Disconnecting Prisma in afterEach
t.afterEach(async (t: TestWithContext) => {
	await t.context.prisma.$disconnect(); // Should be in t.after()
	await t.context.app.close();
});

// ✅ GOOD: Using randomUUID for unique IDs
const user = await prisma.user.create({
	data: { id: randomUUID() },
});
```

## Key Takeaways

1. **Consistency is key**: Follow the same patterns across all test files
2. **Type safety**: Always use proper TypeScript types for test functions
3. **Clear naming**: `"functionName - should ..."` for helpers, `"METHOD /path - should ..."` for routes
4. **Prisma lifecycle**: `before`/`after` for connection, `beforeEach`/`afterEach` for Fastify app
5. **Comprehensive testing**: Test success, failure, and edge cases
6. **Verify relationships**: Always check that Prisma relations are properly included
7. **Clean separation**: Keep test setup, execution, and assertions clearly separated
8. **Resource cleanup**: Close app in afterEach, disconnect Prisma in after — no DB cleanup needed
9. **Minimal beforeEach**: Only insert data that ALL tests need
10. **Test-specific data**: Insert scenario-specific data in individual tests
11. **Unique IDs**: Always use `randomUUID()` for entity identifiers
12. **Mock responsibly**: Save and restore the original dispatcher when using MockAgent
