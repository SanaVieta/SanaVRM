import type { DataSource } from "typeorm";
import { AppDataSource } from "@/lib/db/data-source";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

let initializing: Promise<DataSource> | undefined;

async function initializeWithRetry(): Promise<DataSource> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await AppDataSource.initialize();
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) {
        throw error;
      }
      console.warn(
        `Database connection attempt ${attempt}/${MAX_ATTEMPTS} failed, retrying`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function getDb(): Promise<DataSource> {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  initializing ??= initializeWithRetry().catch((error) => {
    // Allow a later call to retry after a failed connection attempt.
    initializing = undefined;
    throw error;
  });

  return initializing;
}
