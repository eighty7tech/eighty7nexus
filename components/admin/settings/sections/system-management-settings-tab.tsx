"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getSystemInfo,
  runDatabaseSeed,
  runDatabaseReset,
  runDatabaseExportDemo,
  runSystemBackup,
  clearAppCache,
} from "@/app/actions/system-actions";
import { toast } from "sonner";
import { Loader2, Database, Upload, Download, AlertTriangle, RefreshCcw, Activity, Eraser } from "lucide-react";
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
import { SettingsTabHeader } from "./settings-tab-header";
import type { Settings } from "@/components/admin/settings/types";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function SystemManagementSettingsTab(props: {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateNestedField: (path: string, value: unknown) => void;
  onSave: () => void | Promise<unknown>;
}) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(true);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    setIsFetchingInfo(true);
    try {
      const res = await getSystemInfo();
      if (res.success) {
        setSystemInfo(res.data);
      } else {
        toast.error("Failed to fetch system info");
      }
    } catch (error) {
      toast.error("An error occurred fetching system info");
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleAction = (actionFn: () => Promise<any>, successMessage: string) => {
    startTransition(async () => {
      try {
        const res = await actionFn();
        if (res.success) {
          toast.success(successMessage || res.message);
        } else {
          toast.error(res.message || "Action failed");
        }
      } catch (error: any) {
        toast.error(error.message || "An unexpected error occurred");
      }
    });
  };

  return (
    <div className="space-y-6">
      <SettingsTabHeader
        title={t("settings.systemManagement.title")}
        description={t("settings.systemManagement.description")}
      />

      <div className="grid gap-6 grid-cols-1">
        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>Real-time server and database statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFetchingInfo ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : systemInfo ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Node Version</span>
                  <span className="font-medium">{systemInfo.nodeVersion}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Platform</span>
                  <span className="font-medium">{systemInfo.platform}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Database Name</span>
                  <span className="font-medium">{systemInfo.dbName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">DB Connection</span>
                  <span className="font-medium">
                    {systemInfo.dbConnected ? (
                      <span className="text-green-600 dark:text-green-400">Connected</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">Disconnected</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Memory Usage</span>
                  <span className="font-medium">
                    {formatBytes(systemInfo.memoryUsage.rss)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">System Free Memory</span>
                  <span className="font-medium">
                    {formatBytes(systemInfo.freeMemory)} / {formatBytes(systemInfo.totalMemory)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Unable to load data.</p>
            )}
            <Button variant="outline" size="sm" onClick={fetchSystemInfo} disabled={isFetchingInfo}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Info
            </Button>
          </CardContent>
        </Card>

        {/* Database Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Operations
            </CardTitle>
            <CardDescription>Seed or export demo data for the current database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Import Demo Data</h4>
                  <p className="text-xs text-muted-foreground">Populates the database with demo store data.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isPending}>
                      <Upload className="mr-2 h-4 w-4" /> Import Demo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Import Demo Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will populate your database with seed data. Note that running this on a database that already has conflicting manual entries might cause issues.
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
                  <p className="text-xs text-muted-foreground">Exports current catalog to seed-data snapshots.</p>
                </div>
                <Button variant="outline" disabled={isPending} onClick={() => handleAction(runDatabaseExportDemo, "Demo data successfully exported!")}>
                  <Download className="mr-2 h-4 w-4" /> Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Backup System
            </CardTitle>
            <CardDescription>Create a full database backup using mongodump.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This action requires `mongodump` to be installed on the server hosting this application. It will create a dump inside the `/backups` folder.
            </p>
            <Button
              disabled={isPending}
              onClick={() => handleAction(runSystemBackup, "Backup completed successfully!")}
            >
              <Download className="mr-2 h-4 w-4" /> Create Full Backup
            </Button>
          </CardContent>
        </Card>

        {/* Application Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eraser className="h-5 w-5" />
              Application Maintenance
            </CardTitle>
            <CardDescription>Clear application cache and perform routine server maintenance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Clear Application Cache</h4>
                  <p className="text-xs text-muted-foreground">Revalidates all cached layouts, pages, and API routes.</p>
                </div>
                <Button variant="outline" disabled={isPending} onClick={() => handleAction(clearAppCache, "Application cache cleared successfully!")}>
                  <Eraser className="mr-2 h-4 w-4" /> Clear Cache
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">
              Irreversible actions that will wipe database content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-background">
              <div>
                <h4 className="font-medium text-sm text-red-600 dark:text-red-400">Full Database Reset</h4>
                <p className="text-xs text-muted-foreground">Drops all collections and wipes the database entirely.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isPending}>
                    <AlertTriangle className="mr-2 h-4 w-4" /> Reset Database
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-red-600">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600">Absolute Warning</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will <strong>PERMANENTLY DELETE</strong> all data in your database. This includes users, products, orders, settings, and media references. This cannot be undone. Are you absolutely sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
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
