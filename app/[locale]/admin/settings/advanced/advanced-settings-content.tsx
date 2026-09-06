"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { clearAppCache } from "@/app/actions/system-actions";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertTriangle, FileJson, RefreshCcw } from "lucide-react";

export function AdvancedSettingsContent() {
  const [isUploading, setIsUploading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    // Open backup endpoint in new window to trigger download
    window.open("/api/admin/settings/advanced/backup", "_blank");
    toast.success("Backup downloaded");
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("WARNING: This will overwrite your live settings with the contents of this backup. Are you sure you want to proceed?")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/settings/advanced/backup", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(data.message);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data.error || "Failed to restore settings");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePurgeCache = async () => {
    setIsPurging(true);
    try {
      const res = await clearAppCache();
      if (res.success) {
        toast.success("Application cache purged successfully");
      } else {
        toast.error("Failed to purge cache");
      }
    } catch (error) {
      toast.error("Error purging cache");
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Settings Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Backup Settings
          </CardTitle>
          <CardDescription>
            Download a complete snapshot of all store settings, theme configurations, and API keys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
            <FileJson className="h-8 w-8 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              The backup is exported as a standard JSON file. Keep this file secure as it contains API keys and sensitive configuration data.
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleBackup} className="w-full">
            Download Settings JSON
          </Button>
        </CardFooter>
      </Card>

      {/* Settings Restore */}
      <Card className="border-orange-500/30 shadow-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Upload className="h-5 w-5" /> Restore Settings
          </CardTitle>
          <CardDescription>
            Restore settings from a previously downloaded JSON backup file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Warning:</strong> Restoring a backup will instantly overwrite all current settings. This action cannot be undone.
            </div>
          </div>
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleRestore}
          />
        </CardContent>
        <CardFooter>
          <Button 
            variant="destructive" 
            className="w-full"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? "Restoring..." : "Upload & Restore JSON"}
          </Button>
        </CardFooter>
      </Card>

      {/* Advanced Maintenance */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" /> Cache & Maintenance
          </CardTitle>
          <CardDescription>
            Tools to force system synchronization and resolve stale data issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 border rounded-lg flex flex-col justify-between">
            <div>
              <h4 className="font-medium mb-1">Purge System Cache</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Invalidates all Next.js server caches. Use this if recent changes aren't appearing on the storefront.
              </p>
            </div>
            <Button variant="outline" onClick={handlePurgeCache} disabled={isPurging}>
              {isPurging ? "Purging..." : "Purge Cache"}
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg flex flex-col justify-between opacity-70">
            <div>
              <h4 className="font-medium mb-1">Force Settings Sync (Coming Soon)</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Forces all edge nodes to refetch settings from the primary database immediately.
              </p>
            </div>
            <Button variant="outline" disabled>Sync Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
