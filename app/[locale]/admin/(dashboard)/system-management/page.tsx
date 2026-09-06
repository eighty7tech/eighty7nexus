"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getSystemInfo,
  runDatabaseSeed,
  runDatabaseReset,
  runDatabaseExportDemo,
  runSystemBackup,
  listSystemBackupsAction,
  restoreSystemBackupAction,
  getSystemUpdateStatusAction,
  runSystemUpdateAction,
  runReconcileIndexesAction,
  clearAppCache,
  getSystemChangelogAction,
  ChangelogRelease,
  restoreSystemBackupFromPayloadAction,
} from "@/app/actions/system-actions";
import { toast } from "sonner";
import {
  Loader2,
  Database,
  Upload,
  Download,
  AlertTriangle,
  RefreshCcw,
  Activity,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  FileArchive,
  Layers,
  History,
  Search,
  PlusCircle,
  Wrench,
  Bug,
  FileText,
  HardDriveDownload,
  HardDriveUpload,
  Clock,
  FolderArchive,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function SystemManagementPage() {
  const [isPending, startTransition] = useTransition();
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(true);
  const [updateStatus, setUpdateStatus] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [isFetchingBackups, setIsFetchingBackups] = useState(true);

  // Changelog state
  const [releases, setReleases] = useState<ChangelogRelease[]>([]);
  const [changelogSearch, setChangelogSearch] = useState("");
  const [isFetchingChangelog, setIsFetchingChangelog] = useState(true);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [rawMarkdown, setRawMarkdown] = useState("");

  useEffect(() => {
    fetchSystemInfo();
    fetchUpdateStatus();
    fetchBackups();
    fetchChangelog();
  }, []);

  const fetchSystemInfo = async () => {
    setIsFetchingInfo(true);
    try {
      const res = await getSystemInfo();
      if (res.success) {
        setSystemInfo(res.data);
      }
    } catch {
      toast.error("Failed to fetch server telemetry.");
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const fetchUpdateStatus = async () => {
    try {
      const res = await getSystemUpdateStatusAction();
      if (res.success) {
        setUpdateStatus(res.data);
      }
    } catch {
      console.warn("Could not retrieve update status");
    }
  };

  const fetchBackups = async () => {
    setIsFetchingBackups(true);
    try {
      const res = await listSystemBackupsAction();
      if (res.success && res.data) {
        setBackups(res.data);
      }
    } catch {
      toast.error("Failed to load backup snapshots.");
    } finally {
      setIsFetchingBackups(false);
    }
  };

  const fetchChangelog = async () => {
    setIsFetchingChangelog(true);
    try {
      const res = await getSystemChangelogAction();
      if (res.success) {
        setReleases(res.releases);
        setRawMarkdown(res.rawMarkdown);
      }
    } catch {
      console.warn("Could not fetch system changelog");
    } finally {
      setIsFetchingChangelog(false);
    }
  };

  const handleAction = (actionFn: () => Promise<any>, successMessage?: string) => {
    startTransition(async () => {
      try {
        const res = await actionFn();
        if (res.success) {
          toast.success(successMessage || res.message || "Operation successful!");
          fetchBackups();
          fetchSystemInfo();
          fetchChangelog();
        } else {
          toast.error(res.message || "Action failed");
        }
      } catch (error: any) {
        toast.error(error.message || "An unexpected error occurred");
      }
    });
  };

  const filteredReleases = releases.filter((r) => {
    if (!changelogSearch.trim()) return true;
    const query = changelogSearch.toLowerCase();
    return (
      r.version.toLowerCase().includes(query) ||
      r.added.some((i) => i.toLowerCase().includes(query)) ||
      r.improvements.some((i) => i.toLowerCase().includes(query)) ||
      r.fixes.some((i) => i.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System & POS Management</h1>
          <p className="text-muted-foreground">
            Zero-CLI 1-click platform updates, native streaming backups, restore points, changelog, and database reconcilers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(clearAppCache, "Application cache invalidated successfully.")}
            disabled={isPending}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Purge Cache
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleAction(runReconcileIndexesAction)}
            disabled={isPending}
          >
            <Layers className="mr-2 h-4 w-4" /> Reconcile Indexes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1-Click Auto-Updater Hub */}
        <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                1-Click System Updater
              </CardTitle>
              {updateStatus && (
                <Badge variant={updateStatus.isUpdateAvailable ? "destructive" : "secondary"}>
                  v{updateStatus.currentVersion}
                </Badge>
              )}
            </div>
            <CardDescription>
              Autonomous feature upgrades, schema migrations, and index alignment without command line execution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {updateStatus && (
              <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span>Release Notes (v{updateStatus.releaseNotes.version})</span>
                  <span className="text-muted-foreground">{updateStatus.releaseNotes.releaseDate}</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {updateStatus.releaseNotes.highlights.map((h: string, idx: number) => (
                    <li key={idx}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Auto-generates safety snapshot before updating
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isPending} className="bg-primary hover:bg-primary/90">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Update System Now
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Execute 1-Click Platform Update?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will automatically create a pre-upgrade safety snapshot, reconcile database compound indexes, execute pending migrations, and refresh the runtime cache.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        handleAction(
                          runSystemUpdateAction,
                          "System successfully updated with zero command-line execution!"
                        )
                      }
                    >
                      Confirm & Update
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* System Telemetry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Server & POS Telemetry
            </CardTitle>
            <CardDescription>Real-time runtime statistics and memory footprint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFetchingInfo ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : systemInfo ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Node Version</span>
                  <span className="font-medium">{systemInfo.nodeVersion}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Platform</span>
                  <span className="font-medium capitalize">{systemInfo.platform}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Database Cluster</span>
                  <span className="font-medium">{systemInfo.dbName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">DB Connection</span>
                  <span className="font-medium">
                    {systemInfo.dbConnected ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400">Disconnected</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Memory RSS</span>
                  <span className="font-medium">{formatBytes(systemInfo.memoryUsage.rss)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">System Memory</span>
                  <span className="font-medium">
                    {formatBytes(systemInfo.freeMemory)} / {formatBytes(systemInfo.totalMemory)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Unable to load telemetry.</p>
            )}
            <Button variant="outline" size="sm" onClick={fetchSystemInfo} disabled={isFetchingInfo}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Telemetry
            </Button>
          </CardContent>
        </Card>

        {/* System Changelog Hub */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  System Changelog & Feature Timeline
                </CardTitle>
                <CardDescription>
                  Chronological record of newly added features, enhancements, and bug fixes applied to Eighty7Nexus.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search changelog..."
                    value={changelogSearch}
                    onChange={(e) => setChangelogSearch(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRawMarkdown(!showRawMarkdown)}
                  className="h-9 text-xs"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  {showRawMarkdown ? "Visual View" : "Raw Markdown"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isFetchingChangelog ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : showRawMarkdown ? (
              <pre className="p-4 rounded-lg bg-muted text-xs font-mono max-h-96 overflow-y-auto whitespace-pre-wrap">
                {rawMarkdown}
              </pre>
            ) : filteredReleases.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No changelog entries matching &quot;{changelogSearch}&quot;.
              </div>
            ) : (
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {filteredReleases.map((rel, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border bg-card p-4 space-y-3 transition-colors hover:border-primary/40 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="font-semibold text-xs">
                          {rel.version}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">{rel.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {rel.added.length > 0 && (
                          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            +{rel.added.length} Added
                          </Badge>
                        )}
                        {rel.improvements.length > 0 && (
                          <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-500/30">
                            +{rel.improvements.length} Improvements
                          </Badge>
                        )}
                        {rel.fixes.length > 0 && (
                          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30">
                            +{rel.fixes.length} Fixes
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Added List */}
                    {rel.added.length > 0 && (
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                          <PlusCircle className="h-3.5 w-3.5" /> Added:
                        </h5>
                        <ul className="space-y-1 pl-5 list-disc text-xs text-muted-foreground">
                          {rel.added.map((item, itemIdx) => (
                            <li key={itemIdx} dangerouslySetInnerHTML={{ __html: item }} />
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements List */}
                    {rel.improvements.length > 0 && (
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
                          <Wrench className="h-3.5 w-3.5" /> Improvements:
                        </h5>
                        <ul className="space-y-1 pl-5 list-disc text-xs text-muted-foreground">
                          {rel.improvements.map((item, itemIdx) => (
                            <li key={itemIdx} dangerouslySetInnerHTML={{ __html: item }} />
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Fixes List */}
                    {rel.fixes.length > 0 && (
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                          <Bug className="h-3.5 w-3.5" /> Fixes:
                        </h5>
                        <ul className="space-y-1 pl-5 list-disc text-xs text-muted-foreground">
                          {rel.fixes.map((item, itemIdx) => (
                            <li key={itemIdx} dangerouslySetInnerHTML={{ __html: item }} />
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Snapshots & Restore Points — Two-Column Layout */}
        <Card className="md:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="h-5 w-5 text-primary" />
              Database Snapshots &amp; Restore Points
            </CardTitle>
            <CardDescription>
              Native JSON streaming snapshots. Create instant backups and restore previous checkpoints without external tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* LEFT COL: Create Backup */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <HardDriveDownload className="h-4 w-4 text-emerald-500" />
                  <h3 className="font-semibold text-sm">Create Backup</h3>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10 p-4 space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">Instant Database Snapshot</h4>
                    <p className="text-xs text-muted-foreground">
                      Exports all collections to a timestamped JSON archive. Stored locally and listed in the restore panel.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Includes products, orders, users, settings &amp; all collections</span>
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isPending}
                    onClick={() => handleAction(runSystemBackup, "Instant database snapshot created successfully!")}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Create Instant Snapshot
                  </Button>
                </div>

                <div className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FolderArchive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Snapshot Stats</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/60 p-2 text-center">
                      <div className="text-lg font-bold text-primary">{backups.length}</div>
                      <div className="text-muted-foreground">Total Snapshots</div>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2 text-center">
                      <div className="text-lg font-bold text-primary">
                        {backups.length > 0
                          ? formatBytes(backups.reduce((a: number, b: any) => a + (b.sizeBytes || 0), 0))
                          : "—"}
                      </div>
                      <div className="text-muted-foreground">Total Size</div>
                    </div>
                  </div>
                  {backups.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Latest: {new Date(backups[0]?.createdAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COL: Restore from Backup */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <HardDriveUpload className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-sm">Restore from Backup &amp; _backup</h3>
                </div>

                {isFetchingBackups ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : backups.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center space-y-2">
                    <FolderArchive className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No backup snapshots found in ./backups or ./_backup.</p>
                    <p className="text-xs text-muted-foreground">
                      Click &quot;Create Instant Snapshot&quot; to generate your first restore point.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {backups.map((b) => (
                      <div
                        key={b.id}
                        className="rounded-xl border bg-card p-3 hover:border-amber-500/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-mono text-xs font-semibold truncate text-foreground">
                                {b.fileName}
                              </p>
                              {b.filePath && b.filePath.includes("_backup") ? (
                                <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 py-0 h-4">
                                  _backup
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(b.createdAt).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Database className="h-3 w-3" />
                                {b.collectionsCount} collections
                              </span>
                              <span>{b.totalDocuments.toLocaleString()} docs</span>
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                {formatBytes(b.sizeBytes)}
                              </Badge>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isPending}
                                className="h-8 shrink-0 border-amber-500/40 text-amber-600 hover:bg-amber-50 hover:border-amber-500 dark:hover:bg-amber-950/30"
                              >
                                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                Restore
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Restore Snapshot &quot;{b.fileName}&quot;?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Restoring this snapshot will replace current collections with the data in this archive ({b.totalDocuments.toLocaleString()} documents). This action cannot be undone. Are you sure you want to proceed?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-amber-600 hover:bg-amber-700 text-white"
                                  onClick={() =>
                                    handleAction(
                                      () => restoreSystemBackupAction(b.fileName),
                                      `Successfully restored snapshot ${b.fileName}`
                                    )
                                  }
                                >
                                  Yes, Restore Snapshot
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 w-full pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={fetchBackups}
                    disabled={isFetchingBackups || isPending}
                  >
                    <RefreshCcw className="mr-1.5 h-3 w-3" />
                    Refresh
                  </Button>
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        startTransition(async () => {
                          try {
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              try {
                                const payload = event.target?.result as string;
                                const res = await restoreSystemBackupFromPayloadAction(payload);
                                if (res.success) {
                                  toast.success(res.message);
                                  fetchBackups();
                                  fetchSystemInfo();
                                } else {
                                  toast.error(res.message);
                                }
                              } catch (err: any) {
                                toast.error(err.message || "Failed to process backup file");
                              }
                            };
                            reader.readAsText(file);
                          } catch (error: any) {
                            toast.error(error.message || "Could not read file");
                          }
                        });
                        e.target.value = ""; // reset
                      }}
                    />
                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 w-full cursor-pointer">
                      <Upload className="mr-1.5 h-3 w-3" />
                      Upload Backup
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Data Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Demo Data Operations
            </CardTitle>
            <CardDescription>Seed sample retail catalog or export snapshot fixture files.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Import Demo Data</h4>
                  <p className="text-xs text-muted-foreground">Populates sample products, categories, and POS vendors.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isPending} size="sm">
                      <Upload className="mr-2 h-4 w-4" /> Import Demo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Import Demo Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will populate your database with seed data. Note that running this on a database with conflicting entries might cause duplicate keys.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleAction(runDatabaseSeed, "Database successfully seeded!")}
                      >
                        Yes, Import Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Export Demo Snapshots</h4>
                  <p className="text-xs text-muted-foreground">Exports current catalog to seed-data fixtures.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleAction(runDatabaseExportDemo, "Demo data successfully exported!")}
                >
                  <Download className="mr-2 h-4 w-4" /> Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-rose-600/80 dark:text-rose-400/80">
              Irreversible destructive actions that wipe database content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-rose-200 dark:border-rose-900/60 rounded-lg bg-background">
              <div>
                <h4 className="font-medium text-sm text-rose-600 dark:text-rose-400">Full Database Reset</h4>
                <p className="text-xs text-muted-foreground">Drops all collections and wipes database state entirely.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isPending}>
                    <AlertTriangle className="mr-2 h-4 w-4" /> Reset Database
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-rose-600">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-rose-600">Absolute Warning</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will <strong>PERMANENTLY DELETE</strong> all collections, products, orders, settings, and users in your database. Ensure you have created a backup snapshot first.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                      onClick={() => handleAction(runDatabaseReset, "Database was completely reset.")}
                    >
                      Yes, Wipe Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
