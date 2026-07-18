import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = resolve(import.meta.dirname, "..");
const testPage = await readFile(resolve(root, "test-page.html"));
const timeoutMs = Number(process.env.FIREFOX_TEST_TIMEOUT_MS ?? 45000);

let reportDiagnostic;
const diagnosticPromise = new Promise((resolveDiagnostic) => {
  reportDiagnostic = resolveDiagnostic;
});

const server = createServer((request, response) => {
  const requestUrl = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "127.0.0.1"}`
  );

  if (requestUrl.pathname === "/test-page.html") {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    });
    response.end(testPage);
    return;
  }

  if (requestUrl.pathname === "/diagnostic") {
    reportDiagnostic({
      result: requestUrl.searchParams.get("result") ?? "",
      detail: requestUrl.searchParams.get("detail") ?? ""
    });
    response.writeHead(204, { "Cache-Control": "no-store" });
    response.end();
    return;
  }

  response.writeHead(404);
  response.end();
});

await new Promise((resolveListening, rejectListening) => {
  server.once("error", rejectListening);
  server.listen(0, "127.0.0.1", resolveListening);
});

const address = server.address();
if (!address || typeof address === "string") {
  throw new Error("The Firefox test server did not expose a TCP port.");
}

const webExtBinary = resolve(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "web-ext.cmd" : "web-ext"
);
const startUrl =
  `http://127.0.0.1:${address.port}/test-page.html?auto=1`;
const webExtArguments = [
  "run",
  "--source-dir",
  "dist",
  "--no-input",
  "--no-reload",
  "--start-url",
  startUrl,
  "--args=-headless"
];

if (process.env.FIREFOX_BINARY) {
  webExtArguments.push("--firefox", process.env.FIREFOX_BINARY);
}

const firefoxProcess = spawn(webExtBinary, webExtArguments, {
  cwd: root,
  detached: process.platform !== "win32",
  env: {
    ...process.env,
    MOZ_CRASHREPORTER_DISABLE: "1",
    MOZ_HEADLESS: "1"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let standardOutput = "";
let standardError = "";
firefoxProcess.stdout.on("data", (chunk) => {
  standardOutput = appendLog(standardOutput, chunk);
});
firefoxProcess.stderr.on("data", (chunk) => {
  standardError = appendLog(standardError, chunk);
});

let completed = false;
const earlyExitPromise = new Promise((_, rejectExit) => {
  firefoxProcess.once("exit", (code, signal) => {
    if (!completed) {
      rejectExit(
        new Error(
          `Firefox exited before reporting a conversion ` +
            `(code: ${code ?? "none"}, signal: ${signal ?? "none"}).`
        )
      );
    }
  });
});
const timeoutPromise = delay(timeoutMs, undefined, { ref: false }).then(() => {
  throw new Error(
    `Firefox did not report a conversion within ${timeoutMs} ms.`
  );
});

try {
  const diagnostic = await Promise.race([
    diagnosticPromise,
    earlyExitPromise,
    timeoutPromise
  ]);
  completed = true;

  if (!/^\d[\d .\u00A0]*,\d{2}\s+zł$/u.test(diagnostic.result)) {
    throw new Error(
      `Unexpected tooltip result: ${JSON.stringify(diagnostic.result)}. ` +
        `Detail: ${JSON.stringify(diagnostic.detail)}.`
    );
  }
  if (!/Kurs NBP z \d{4}-\d{2}-\d{2}/u.test(diagnostic.detail)) {
    throw new Error(
      `The tooltip did not expose a dated NBP rate: ` +
        `${JSON.stringify(diagnostic.detail)}.`
    );
  }

  console.log(
    `Firefox runtime smoke test passed: ${diagnostic.result} ` +
      `(${diagnostic.detail})`
  );
} catch (error) {
  if (standardOutput.trim()) {
    console.error(`web-ext output:\n${standardOutput.trim()}`);
  }
  if (standardError.trim()) {
    console.error(`web-ext errors:\n${standardError.trim()}`);
  }
  throw error;
} finally {
  completed = true;
  await stopProcess(firefoxProcess);
  server.closeAllConnections?.();
  await new Promise((resolveClose) => server.close(resolveClose));
}

function appendLog(existing, chunk) {
  const next = `${existing}${String(chunk)}`;
  return next.length > 16000 ? next.slice(-16000) : next;
}

async function stopProcess(childProcess) {
  if (childProcess.exitCode !== null || childProcess.signalCode !== null) {
    return;
  }

  signalProcessTree(childProcess, "SIGINT");
  await waitForExit(childProcess, 5000);

  if (childProcess.exitCode === null && childProcess.signalCode === null) {
    signalProcessTree(childProcess, "SIGTERM");
    await waitForExit(childProcess, 3000);
  }

  if (childProcess.exitCode === null && childProcess.signalCode === null) {
    signalProcessTree(childProcess, "SIGKILL");
    await waitForExit(childProcess, 2000);
  }
}

async function waitForExit(childProcess, waitMs) {
  if (childProcess.exitCode !== null || childProcess.signalCode !== null) {
    return;
  }
  await Promise.race([
    new Promise((resolveExit) => childProcess.once("exit", resolveExit)),
    delay(waitMs)
  ]);
}

function signalProcessTree(childProcess, signal) {
  if (process.platform !== "win32" && childProcess.pid) {
    try {
      process.kill(-childProcess.pid, signal);
      return;
    } catch (error) {
      if (error?.code !== "ESRCH") {
        throw error;
      }
      return;
    }
  }
  childProcess.kill(signal);
}
