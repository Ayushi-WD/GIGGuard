"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The fetch lifecycle updates loading and error state around an external request. */

import { useCallback, useEffect, useState } from "react";

import { getWorker, getWorkers } from "@/lib/api";
import { rememberWorker } from "@/lib/storage";
import type { Worker } from "@/lib/types";

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function useWorker(workerId: string | null | undefined) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(Boolean(workerId));
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!workerId) {
      setWorker(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getWorker(workerId, controller.signal)
      .then((data) => {
        setWorker(data);
        rememberWorker(data.id);
      })
      .catch((caught: unknown) => {
        if (isAbortError(caught)) {
          return;
        }
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load this worker profile.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [workerId, reloadToken]);

  return { worker, loading, error, reload };
}

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getWorkers(controller.signal)
      .then((data) => {
        setWorkers(data);
      })
      .catch((caught: unknown) => {
        if (isAbortError(caught)) {
          return;
        }
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load worker profiles.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [reloadToken]);

  return { workers, loading, error, reload };
}
