import { spawn } from "child_process";
import { fileURLToPath } from "url";

const bridgePath = fileURLToPath(
  new URL("../python/spotapi_bridge.py", import.meta.url),
);

export function fetchMedia(mediaType, mediaId) {
  const pythonCommand = process.env.PYTHON_BIN || "python";
  const timeoutMs = Number(process.env.SPOTAPI_TIMEOUT_MS || 120000);

  return new Promise((resolve, reject) => {
    const child = spawn(pythonCommand, [bridgePath, mediaType, mediaId], {
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback(value);
    };

    const timeout = setTimeout(() => {
      child.kill();
      finish(reject, new Error("SpotAPI request timed out."));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      finish(
        reject,
        new Error(`Could not start Python bridge: ${error.message}`),
      );
    });
    child.on("close", (code) => {
      if (code !== 0) {
        finish(
          reject,
          new Error(
            stderr.trim() || `SpotAPI bridge exited with code ${code}.`,
          ),
        );
        return;
      }

      try {
        finish(resolve, JSON.parse(stdout));
      } catch {
        finish(reject, new Error("SpotAPI bridge returned invalid JSON."));
      }
    });
  });
}
