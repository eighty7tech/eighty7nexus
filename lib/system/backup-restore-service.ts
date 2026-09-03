/**
 * Zero-CLI Native Database Backup & Restore Engine
 * Provides native JSON/BSON streaming database snapshots and point-in-time
 * restoration without requiring external host binaries like mongodump/mongorestore.
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export interface BackupMetadata {
  id: string;
  fileName: string;
  filePath: string;
  sizeBytes: number;
  createdAt: Date;
  collectionsCount: number;
  totalDocuments: number;
  summary: Record<string, number>;
}

export interface BackupResult {
  success: boolean;
  fileName: string;
  totalDocuments: number;
  collectionsCount: number;
  sizeBytes: number;
  createdAt: Date;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  restoredCollectionsCount: number;
  restoredDocumentsCount: number;
  durationMs: number;
  error?: string;
}

const BACKUPS_DIR = path.join(process.cwd(), "backups");
const ROOT_BACKUP_DIR = path.join(process.cwd(), "_backup");

function ensureBackupsDir() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function findBackupFile(fileName: string): string | null {
  const safeFileName = path.basename(fileName);
  const directBackups = path.join(BACKUPS_DIR, safeFileName);
  if (fs.existsSync(directBackups)) return directBackups;

  const directRoot = path.join(ROOT_BACKUP_DIR, safeFileName);
  if (fs.existsSync(directRoot)) return directRoot;

  if (fs.existsSync(ROOT_BACKUP_DIR)) {
    const scanDir = (dir: string): string | null => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            const found = scanDir(fullPath);
            if (found) return found;
          } else if (entry.name === safeFileName) {
            return fullPath;
          }
        }
      } catch {
        // ignore unreadable dirs
      }
      return null;
    };
    return scanDir(ROOT_BACKUP_DIR);
  }

  return null;
}

/**
 * Creates a complete native JSON snapshot of all database collections.
 */
export async function createNativeDatabaseBackup(label = "manual"): Promise<BackupResult> {
  await connectDB();
  ensureBackupsDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `snapshot-${label}-${timestamp}.json`;
  const filePath = path.join(BACKUPS_DIR, fileName);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection is not ready.");
  }

  const collections = await db.listCollections().toArray();
  const backupData: Record<string, unknown[]> = {};
  const summary: Record<string, number> = {};
  let totalDocs = 0;

  for (const col of collections) {
    // Skip system/internal collections
    if (col.name.startsWith("system.")) continue;

    const collectionInstance = db.collection(col.name);
    const documents = await collectionInstance.find({}).toArray();

    backupData[col.name] = documents;
    summary[col.name] = documents.length;
    totalDocs += documents.length;
  }

  const payload = {
    version: "1.0",
    createdAt: new Date().toISOString(),
    label,
    totalDocuments: totalDocs,
    collectionsCount: Object.keys(backupData).length,
    summary,
    data: backupData,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  fs.writeFileSync(filePath, jsonString, "utf8");
  const stats = fs.statSync(filePath);

  return {
    success: true,
    fileName,
    totalDocuments: totalDocs,
    collectionsCount: Object.keys(backupData).length,
    sizeBytes: stats.size,
    createdAt: new Date(),
  };
}

/**
 * Lists all available database snapshot files stored in `./backups` and `./_backup`.
 */
export async function listAvailableBackups(): Promise<BackupMetadata[]> {
  ensureBackupsDir();
  const backups: BackupMetadata[] = [];
  const scannedFiles = new Set<string>();

  const processFile = (filePath: string, fileName: string) => {
    if (!fileName.endsWith(".json") || scannedFiles.has(fileName)) return;
    try {
      const stats = fs.statSync(filePath);
      // Skip files over 50MB from synchronous json parse in listing
      if (stats.size > 50 * 1024 * 1024) return;
      const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (content && typeof content === "object" && (content.data || content.totalDocuments !== undefined)) {
        scannedFiles.add(fileName);
        backups.push({
          id: fileName,
          fileName,
          filePath,
          sizeBytes: stats.size,
          createdAt: new Date(content.createdAt || stats.mtime),
          collectionsCount: content.collectionsCount || Object.keys(content.data || {}).length,
          totalDocuments: content.totalDocuments || 0,
          summary: content.summary || {},
        });
      }
    } catch {
      // Not a json backup or malformed
    }
  };

  if (fs.existsSync(BACKUPS_DIR)) {
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      processFile(path.join(BACKUPS_DIR, f), f);
    }
  }

  if (fs.existsSync(ROOT_BACKUP_DIR)) {
    const scanDir = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (entry.name.endsWith(".json")) {
            processFile(fullPath, entry.name);
          }
        }
      } catch {
        // ignore unreadable
      }
    };
    scanDir(ROOT_BACKUP_DIR);
  }

  return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Restores the database from a specified snapshot file.
 */
export async function restoreNativeDatabaseBackup(fileName: string): Promise<RestoreResult> {
  const startTime = Date.now();
  await connectDB();
  ensureBackupsDir();

  const filePath = findBackupFile(fileName);

  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Backup snapshot file "${fileName}" not found in ./backups or ./_backup.`);
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection is not ready.");
  }

  const rawContent = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(rawContent);

  if (!parsed.data || typeof parsed.data !== "object") {
    throw new Error("Invalid backup archive format: missing data payload.");
  }

  let restoredCollections = 0;
  let restoredDocuments = 0;

  for (const [colName, docs] of Object.entries(parsed.data)) {
    if (!Array.isArray(docs) || docs.length === 0) continue;

    const collectionInstance = db.collection(colName);
    // Clear collection before restore
    await collectionInstance.deleteMany({});
    // Insert snapshot documents
    await collectionInstance.insertMany(docs);

    restoredCollections += 1;
    restoredDocuments += docs.length;
  }

  return {
    success: true,
    restoredCollectionsCount: restoredCollections,
    restoredDocumentsCount: restoredDocuments,
    durationMs: Date.now() - startTime,
  };
}

export async function restoreNativeDatabaseBackupFromPayload(rawContent: string) {
  const startTime = Date.now();
  await connectDB();

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection is not ready.");
  }

  const parsed = JSON.parse(rawContent);

  if (!parsed.data || typeof parsed.data !== "object") {
    throw new Error("Invalid backup archive format: missing data payload.");
  }

  let restoredCollections = 0;
  let restoredDocuments = 0;

  for (const [colName, docs] of Object.entries(parsed.data)) {
    if (!Array.isArray(docs) || docs.length === 0) continue;

    const collectionInstance = db.collection(colName);
    // Clear collection before restore
    await collectionInstance.deleteMany({});
    // Insert snapshot documents
    await collectionInstance.insertMany(docs);

    restoredCollections += 1;
    restoredDocuments += docs.length;
  }

  return {
    success: true,
    restoredCollectionsCount: restoredCollections,
    restoredDocumentsCount: restoredDocuments,
    durationMs: Date.now() - startTime,
  };
}
