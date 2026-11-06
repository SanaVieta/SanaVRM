import { setTimeout as sleep } from "node:timers/promises";
import type { DataSource } from "typeorm";
import { AppDataSource } from "@/lib/db/data-source";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 10000;

let initializing: Promise<DataSource> | undefined;

async function connectWithRetry(): Promise<DataSource> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await AppDataSource.initialize();
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) {
        throw error;
      }
      console.warn(
        `Database connection attempt ${attempt}/${MAX_ATTEMPTS} failed, retrying in ${RETRY_DELAY_MS}ms`,
        error,
      );
      await sleep(RETRY_DELAY_MS);
    }
  }
}

export async function getDb(): Promise<DataSource> {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  // Shared by concurrent first calls so the retries run once, not per caller.
  initializing ??= connectWithRetry().catch((error) => {
    // After the attempts are used up, let a later call start a fresh set.
    initializing = undefined;
    throw error;
  });

  return initializing;
}
