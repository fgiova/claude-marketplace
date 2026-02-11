---
name: tap-testcontainers
description: |
  Activate when working with node-tap tests that use Testcontainers, writing integration tests with Docker containers,
  or discussing container-based testing strategies in Node.js.
  Trigger keywords: node-tap, tap, testcontainers, testcontainer, integration test, container test,
  docker test, GenericContainer, StartedTestContainer, test lifecycle, test setup, test teardown,
  t.before, t.after, t.teardown, PostgreSqlContainer, RedisContainer, GenericContainer.
version: 0.1.0
---

# Node-tap + Testcontainers Expert

This skill provides patterns for writing integration tests in Node.js using **node-tap** as the test framework and **Testcontainers** for spinning up Docker-based dependencies (Redis, PostgreSQL, etc.).

The architecture uses tap's `before`/`after` lifecycle hooks to start and stop containers, a shared `test-env.json` file to pass connection details between processes, and a `localtest.ts` helper that each test imports to load the environment.

## Architecture Overview

```
tap before (before.js)
  ├── Start Ryuk reaper (container cleanup safety net)
  ├── Start service containers (Redis, Postgres, etc.)
  ├── Run bootstrap functions (seed data, migrations)
  └── Write test-env.json (connection URLs, reaper info)
        │
        ▼
test files (*.test.ts)
  ├── import localtest.ts
  │     ├── Load .env.test (static config)
  │     ├── Load test-env.json (dynamic container info) into process.env
  │     └── Connect to Ryuk reaper socket (keep-alive)
  └── Run tests using process.env for service URLs
        │
        ▼
tap after (teardown.js)
  ├── Stop all containers matching reaper-session-id
  └── Delete test-env.json
```

## Directory Structure

```
test/
├── helpers/
│   └── localtest.ts            # Environment loader, imported by every test file
├── scripts/
│   ├── executors/
│   │   ├── before.js           # Tap before hook: start containers
│   │   └── teardown.js         # Tap after hook: stop containers
│   └── runners/
│       ├── redis.js            # Redis container start + bootstrap
│       └── postgres.js         # (example) Postgres container start + bootstrap
├── my-feature.test.ts
└── another.test.ts
```

## Setup

### 1. Install Dependencies

```bash
npm install --save-dev tap testcontainers dotenv
```

### 2. Configure tap in `package.json`

```json
{
  "tap": {
    "before": "./test/scripts/executors/before.js",
    "after": "./test/scripts/executors/teardown.js",
    "exclude": [
      "test/helpers/**/*",
      "test/scripts/**/*"
    ]
  },
  "scripts": {
    "test": "tap --timeout=90",
    "test:debug": "tap --only --timeout=0",
    "test:local": "TEST_LOCAL=true tap",
    "test:local:debug": "TEST_LOCAL=true tap --only --timeout=0",
    "test:coverage": "tap --coverage-report=lcovonly --coverage-report=text"
  }
}
```

### 3. Create a container runner

Each service gets its own runner module that exports `startContainer()` and `bootstrap()`.

Example for Redis — `test/scripts/runners/redis.js`:
```javascript
import { GenericContainer, Wait } from "testcontainers";

const startContainer = async () => {
    const redis = await new GenericContainer("redis:latest")
        .withExposedPorts(6379)
        .withLabels({
            // Mandatory: links this container to the reaper session for cleanup
            "org.testcontainers.reaper-session-id": process.env.REAPER_SESSION_ID
        })
        .withWaitStrategy(Wait.forLogMessage("Ready to accept connections tcp"))
        .start();
    const port = redis.getMappedPort(6379);
    const host = redis.getHost();
    return {
        container: redis,
        port,
        host
    };
}

/**
 * Optional bootstrap function to seed data or run migrations after container start.
 */
const bootstrap = async (host, port) => {
    // e.g. seed Redis with test data
};

export {
    startContainer,
    bootstrap
}
```

### 4. Create the `before.js` executor

`test/scripts/executors/before.js` — starts the Ryuk reaper, launches containers, and writes `test-env.json`:
```javascript
import { bootstrap as bootstrapRedis, startContainer as startContainerRedis } from "../runners/redis.js";
import { writeFile } from "node:fs/promises";
import { getReaper } from "testcontainers/build/reaper/reaper.js";
import { getContainerRuntimeClient } from "testcontainers";
import { randomUUID } from "node:crypto";

const startReaper = async () => {
    if (process.env.TESTCONTAINERS_RYUK_DISABLED === "true" || process.env.TESTCONTAINERS_RYUK_DISABLED === "1") {
        return {};
    }
    const containerRuntimeClient = await getContainerRuntimeClient();
    await getReaper(containerRuntimeClient);
    const runningContainers = await containerRuntimeClient.container.list();
    const reaper = runningContainers.find((container) => container.Labels["org.testcontainers.ryuk"] === "true");
    const reaperNetwork = reaper.Ports.find((port) => port.PrivatePort == 8080);
    const reaperPort = reaperNetwork.PublicPort;
    const reaperIp = containerRuntimeClient.info.containerRuntime.host;
    const reaperSessionId = reaper.Labels["org.testcontainers.session-id"];
    return {
        REAPER: `${reaperIp}:${reaperPort}`,
        REAPER_SESSION: reaperSessionId,
    }
};

const before = async () => {
    if (!process.env.TEST_LOCAL) {
      return;
    }

    console.log("Start Reaper");
    const reaperEnv = await startReaper();
    process.env.REAPER_SESSION_ID = reaperEnv.REAPER_SESSION ?? randomUUID();

    if (!process.env.SKIP_TEST_REDIS_SETUP) {
        console.log("Start Redis");
        const { port: redisPort, host: redisHost } = await startContainerRedis();
        process.env.REDIS_URL = `redis://${redisHost}:${redisPort}`;
        await bootstrapRedis(redisHost, redisPort);
    }

    await writeFile("test-env.json", JSON.stringify({
        ...reaperEnv,
        ...process.env,
    }));
}

export default before();
```

### 5. Create the `teardown.js` executor

`test/scripts/executors/teardown.js` — stops containers and cleans up `test-env.json`:
```javascript
import { unlink } from "node:fs/promises";
import { getContainerRuntimeClient } from "testcontainers";
import fs from "node:fs";
import path from "node:path";

const teardown = async () => {
    if (process.env.TEST_LOCAL) {
        const jsonString = fs.readFileSync(path.resolve(process.cwd(), "test-env.json"), {
            encoding: "utf8"
        });
        const testEnv = JSON.parse(jsonString);
        if (testEnv.REAPER_SESSION_ID !== undefined && testEnv.REAPER_SESSION_ID !== "") {
            const reaperSessionId = testEnv.REAPER_SESSION_ID;
            const containerRuntimeClient = await getContainerRuntimeClient();
            const runningContainers = await containerRuntimeClient.container.list();
            const containers = runningContainers.filter((container) => container.Labels["org.testcontainers.reaper-session-id"] === reaperSessionId);
            for (const containerInfo of containers) {
                const container = containerRuntimeClient.container.getById(containerInfo.Id);
                await containerRuntimeClient.container.stop(container);
            }
        }
        await unlink("test-env.json");
    }
}

export default teardown();
```

### 6. Create `localtest.ts`

`test/helpers/localtest.ts` — imported by every test file to load environment and connect to the reaper:
```typescript
import fs from "node:fs";
import { Socket } from "node:net";
import path from "node:path";
import { config as dotenvConfig } from "dotenv";
import tap from "tap";

const defaultExport = () => {
    dotenvConfig({
        path: ".env.test",
    });
    if (!process.env.TEST_LOCAL) {
        const jsonString = fs.readFileSync(
            path.resolve(process.cwd(), "test-env.json"),
            {
                encoding: "utf8",
            },
        );
        try {
            const envConfig = JSON.parse(jsonString);

            for (const key in envConfig) {
                process.env[key] = envConfig[key];
            }
        } catch (err) {
            console.error(err);
        }
    }
    if (process.env.REAPER) {
        const [host, port] = process.env.REAPER.split(":");
        const socket = new Socket();
        socket.connect(Number(port), host, () => {
            socket.write(
                `label=org.testcontainers.session-id=${process.env.REAPER_SESSION}\r\n`,
            );
        });
        socket.on("error", (error) => {
            console.log(error);
        });

        tap.teardown(() => {
            setTimeout(() => {
                socket.destroy();
                // force kill the process if it doesn't stop on its own
                setTimeout(() => {
                    process.exit(0);
                }, 300);
            }, 300);
        });
    }
};

defaultExport();
```

### 7. Create `.env.test`

Add a `.env.test` file with static test configuration (values that don't depend on containers):
```env
APP_ENV=test
# Add any static test config here
# Dynamic values (REDIS_URL, etc.) come from test-env.json
```

### 8. Use in tests

Import the `localtest.ts` helper as the first import in every test file:
```typescript
import "../helpers/localtest";
import t from "tap";
import startServer from "../../src/index.js";

t.test("my integration test", async (t) => {
    const app = await startServer(/* test config */);
    t.teardown(() => app.close());

    const response = await app.inject({ method: "GET", url: "/up" });
    t.equal(response.statusCode, 200);
});
```

## Skipping Container Startup

Speed up test execution by skipping containers via environment variables:

| Variable                          | Effect                                            |
|-----------------------------------|---------------------------------------------------|
| `TEST_LOCAL=true`                 | Skip ALL containers (use existing local services) |
| `SKIP_TEST_<SERVICE>_SETUP=true`  | Skip a specific container (e.g. `SKIP_TEST_REDIS_SETUP`) |

### Examples

```bash
# Run with containers (CI or full integration)
pnpm test

# Run without any containers (fastest, requires local services running)
TEST_LOCAL=true pnpm test

# Run without Redis container only
SKIP_TEST_REDIS_SETUP=true pnpm test
```

**Note**: When skipping containers, ensure the required services are either not needed by your tests or are already running locally.
