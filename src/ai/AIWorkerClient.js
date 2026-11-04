// src/ai/AIWorkerClient.js

import { physicsConfig } from "../ecs/constants/physicsConfig.js";
import { FIXED_DT } from "../ecs/constants/simulation.js";

export function createAIWorker() {
  let worker = null;
  let nextId = 0;
  let disposed = false;

  const pending = new Map();

  function abortError() {
    return new DOMException(
      "AI request cancelled",
      "AbortError"
    );
  }

  function settle(id, error, result) {
    const request = pending.get(id);
    if (!request) return;

    pending.delete(id);

    request.signal?.removeEventListener(
      "abort",
      request.onAbort
    );

    if (error) request.reject(error);
    else request.resolve(result);
  }

  function rejectAll(error) {
    for (const id of [...pending.keys()]) {
      settle(id, error);
    }
  }

  function startWorker() {
    const next = new Worker(
      new URL("./ai.worker.js", import.meta.url),
      { type: "module" }
    );

    next.onmessage = ({ data }) => {
      if (worker !== next) return;

      if (data.error) {
        settle(data.id, new Error(data.error));
      } else {
        settle(data.id, null, data.result);
      }
    };

    next.onerror = (event) => {
      if (worker !== next) return;

      console.error(
        "[AI Worker]",
        event.message || "Worker error"
      );

      restartWorker(
        new Error(event.message || "AI worker failed")
      );
    };

    worker = next;
  }

  function restartWorker(error = abortError()) {
    if (disposed) return;

    const old = worker;
    worker = null;

    old?.terminate();

    rejectAll(error);

    startWorker();
  }

  function cancel() {
    if (disposed || pending.size === 0) return;

    restartWorker();
  }

  function request(type, payload, options = {}) {
    if (disposed) {
      return Promise.reject(
        new Error("AI worker disposed")
      );
    }

    const { signal } = options;

    if (signal?.aborted) {
      return Promise.reject(abortError());
    }

    const id = ++nextId;

    return new Promise((resolve, reject) => {
      const onAbort = () => {
        if (pending.has(id)) {
          restartWorker();
        }
      };

      pending.set(id, {
        resolve,
        reject,
        signal,
        onAbort,
      });

      signal?.addEventListener(
        "abort",
        onAbort,
        { once: true }
      );

      try {
        worker.postMessage({
          id,
          type,
          payload,
          physics: { ...physicsConfig },
          fixedDt: FIXED_DT,
        });
      } catch (error) {
        settle(id, error);
      }
    });
  }

  function dispose() {
    if (disposed) return;

    disposed = true;

    worker?.terminate();
    worker = null;

    rejectAll(abortError());
  }

  startWorker();

  return {
    request,
    cancel,
    dispose,
  };
}
