import { setTimeout as sleepFor } from "node:timers/promises";
import type { DataSource } from "typeorm";
import { AppDataSource } from "@/lib/db/data-source";

const maxAttempts = 3;
const retryDelayMs = 10000;

let initializing: Promise<DataSource> | undefined;

async function connectWithRetry(): Promise<DataSource> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await AppDataSource.initialize();
    } catch (error) {
      if (attempt >= maxAttempts) {
        throw error;
      }
      console.warn(
        `Database connection attempt ${attempt + 1}/${maxAttempts} failed, retrying in ${retryDelayMs}ms`,
        error,
      );
      await sleepFor(retryDelayMs);
    }
  }
}

export async function getDb(): Promise<DataSource> {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  initializing ??= connectWithRetry().catch((error) => {
    initializing = undefined;
    throw error;
  });

  return initializing;
}
