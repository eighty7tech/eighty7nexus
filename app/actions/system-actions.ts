"use server";

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/rbac";
import os from "os";
import { revalidatePath } from "next/cache";
import {
  createNativeDatabaseBackup,
  listAvailableBackups,
  restoreNativeDatabaseBackup,
  restoreNativeDatabaseBackupFromPayload,
} from "@/lib/system/backup-restore-service";
import {
  checkSystemUpdateStatus,
  executeSystemUpdate,
} from "@/lib/system/system-updater-service";
import { reconcileDatabaseIndexes } from "@/lib/db/reconcile-indexes";

const execAsync = promisify(exec);

// Helper to check admin authorization
async function requireAdmin() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || !isAdmin(session.user)) {
    throw new Error("Unauthorized: Only administrators can perform system actions.");
  }
}

export async function getSystemInfo() {
  await requireAdmin();

  const isDbConnected = mongoose.connection.readyState === 1;
  const dbName = mongoose.connection.name || "Not connected";
  
  return {
    success: true,
    data: {
      nodeVersion: process.version,
      platform: os.platform(),
      memoryUsage: process.memoryUsage(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      dbConnected: isDbConnected,
      dbName,
    },
  };
}

export async function runDatabaseSeed() {
  await requireAdmin();
  try {
    const { stdout } = await execAsync("pnpm db:seed", {
      env: process.env,
    });
    return { success: true, message: "Database seeded successfully.", output: stdout };
  } catch (error: any) {
    console.error("Database seed failed:", error);
    return { success: false, message: error.message || "Seed failed" };
  }
}

export async function runDatabaseReset() {
  await requireAdmin();
  try {
    const { stdout } = await execAsync("pnpm db:reset", {
      env: process.env,
    });
    return { success: true, message: "Database reset successfully.", output: stdout };
  } catch (error: any) {
    console.error("Database reset failed:", error);
    return { success: false, message: error.message || "Reset failed" };
  }
}

export async function runDatabaseExportDemo() {
  await requireAdmin();
  try {
    const { stdout } = await execAsync("pnpm db:seed:export", {
      env: process.env,
    });
    return { success: true, message: "Demo data exported successfully.", output: stdout };
  } catch (error: any) {
    console.error("Export demo failed:", error);
    return { success: false, message: error.message || "Export failed" };
  }
}

export async function runSystemBackup() {
  await requireAdmin();
  try {
    const result = await createNativeDatabaseBackup("manual");
    return {
      success: true,
      message: `Native snapshot created: ${result.fileName} (${result.totalDocuments} documents in ${result.collectionsCount} collections).`,
      data: result,
    };
  } catch (error: any) {
    console.error("System backup failed:", error);
    return { success: false, message: error.message || "Backup failed." };
  }
}

export async function listSystemBackupsAction() {
  await requireAdmin();
  try {
    const backups = await listAvailableBackups();
    return { success: true, data: backups };
  } catch (error: any) {
    console.error("List backups failed:", error);
    return { success: false, message: error.message || "Failed to list backups", data: [] };
  }
}

export async function restoreSystemBackupAction(fileName: string) {
  await requireAdmin();
  try {
    const result = await restoreNativeDatabaseBackup(fileName);
    revalidatePath("/", "layout");
    return {
      success: true,
      message: `Restored ${result.restoredDocumentsCount} documents across ${result.restoredCollectionsCount} collections in ${result.durationMs}ms.`,
      data: result,
    };
  } catch (error: any) {
    console.error("Restore backup failed:", error);
    return { success: false, message: error.message || "Restore failed." };
  }
}

export async function restoreSystemBackupFromPayloadAction(payload: string) {
  await requireAdmin();
  try {
    const result = await restoreNativeDatabaseBackupFromPayload(payload);
    revalidatePath("/", "layout");
    return {
      success: true,
      message: `Restored ${result.restoredDocumentsCount} documents across ${result.restoredCollectionsCount} collections in ${result.durationMs}ms from uploaded file.`,
      data: result,
    };
  } catch (error: any) {
    console.error("Restore uploaded backup failed:", error);
    return { success: false, message: error.message || "Restore from upload failed." };
  }
}

export async function getSystemUpdateStatusAction() {
  await requireAdmin();
  try {
    const status = await checkSystemUpdateStatus();
    return { success: true, data: status };
  } catch (error: any) {
    console.error("Check update status failed:", error);
    return { success: false, message: error.message || "Failed to check update status" };
  }
}

export async function runSystemUpdateAction() {
  await requireAdmin();
  try {
    const result = await executeSystemUpdate();
    revalidatePath("/", "layout");
    return {
      success: true,
      message: result.message,
      data: result,
    };
  } catch (error: any) {
    console.error("System update execution failed:", error);
    return { success: false, message: error.message || "Update execution failed" };
  }
}

export async function runReconcileIndexesAction() {
  await requireAdmin();
  try {
    const result = await reconcileDatabaseIndexes();
    return {
      success: true,
      message: `Audited and synchronized indexes across ${result.modelsSynchronizedCount} database models in ${result.totalDurationMs}ms.`,
      data: result,
    };
  } catch (error: any) {
    console.error("Reconcile indexes failed:", error);
    return { success: false, message: error.message || "Index reconciliation failed" };
  }
}

export async function clearAppCache() {
  await requireAdmin();
  try {
    revalidatePath("/", "layout");
    return { success: true, message: "Application cache cleared successfully." };
  } catch (error: any) {
    console.error("Cache clear failed:", error);
    return { success: false, message: error.message || "Failed to clear cache" };
  }
}

export interface ChangelogRelease {
  version: string;
  date: string;
  added: string[];
  improvements: string[];
  fixes: string[];
}

export async function getSystemChangelogAction(): Promise<{
  success: boolean;
  releases: ChangelogRelease[];
  rawMarkdown: string;
}> {
  await requireAdmin();
  try {
    const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
    if (!fs.existsSync(changelogPath)) {
      return { success: true, releases: [], rawMarkdown: "# Changelog\n\nNo changelog file found." };
    }

    const rawMarkdown = fs.readFileSync(changelogPath, "utf8");
    const releases: ChangelogRelease[] = [];

    // Parse Markdown by release headers `## [Version / Date]`
    const sections = rawMarkdown.split(/^##\s+/m);

    for (const sec of sections) {
      if (!sec.trim() || sec.startsWith("# Changelog")) continue;

      const lines = sec.split("\n");
      const titleLine = lines[0]?.trim() || "";
      const dateMatch = titleLine.match(/\[(.*?)\]/);
      const versionDate = dateMatch ? dateMatch[1] : titleLine;

      const added: string[] = [];
      const improvements: string[] = [];
      const fixes: string[] = [];
      let currentCategory: "added" | "improvements" | "fixes" | null = null;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("### Added:")) {
          currentCategory = "added";
        } else if (line.startsWith("### Improvements:")) {
          currentCategory = "improvements";
        } else if (line.startsWith("### Fixes:")) {
          currentCategory = "fixes";
        } else if (line.startsWith("### ") || line.startsWith("## ")) {
          currentCategory = null;
        } else if (line.trim().startsWith("- ") && currentCategory) {
          const item = line.trim().substring(2);
          if (currentCategory === "added") added.push(item);
          if (currentCategory === "improvements") improvements.push(item);
          if (currentCategory === "fixes") fixes.push(item);
        }
      }

      if (added.length > 0 || improvements.length > 0 || fixes.length > 0) {
        releases.push({
          version: versionDate,
          date: versionDate,
          added,
          improvements,
          fixes,
        });
      }
    }

    return {
      success: true,
      releases,
      rawMarkdown,
    };
  } catch (error: any) {
    console.error("Failed to read changelog:", error);
    return {
      success: false,
      releases: [],
      rawMarkdown: "",
    };
  }
}
