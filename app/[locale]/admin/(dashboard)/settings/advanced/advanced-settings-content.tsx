"use client";

import { useState, useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
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
import { Download, Upload, AlertTriangle, FileJson, RefreshCw } from "lucide-react";

export function AdvancedSettingsContent() {
  const t = useTranslations();
  const [isUploading, setIsUploading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" /> {t("admin.advancedSettings.systemBackupCard.title")}
          </CardTitle>
          <CardDescription>
            {t("admin.advancedSettings.systemBackupCard.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
            <FileJson className="h-8 w-8 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              {t("admin.advancedSettings.systemBackupCard.details")}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleBackup} className="w-full">
            {t("admin.advancedSettings.systemBackupCard.downloadButton")}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-orange-500/30 shadow-orange-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Upload className="h-5 w-5" /> {t("admin.advancedSettings.systemBackupCard.restoreTitle")}
          </CardTitle>
          <CardDescription>
            {t("admin.advancedSettings.systemBackupCard.restoreDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800 dark:text-orange-200">
              <strong>{t("admin.common.warning")}:</strong> {t("admin.advancedSettings.systemBackupCard.restoreWarning")}
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
            {isUploading ? t("admin.common.restoring") : t("admin.advancedSettings.systemBackupCard.uploadButton")}
          </Button>
        </CardFooter>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <RefreshCw className="h-4 w-4" /> {t("admin.advancedSettings.resetCard.title")}
          </CardTitle>
          <CardDescription>
            {t("admin.advancedSettings.resetCard.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 border rounded-lg flex flex-col justify-between">
            <div>
              <h4 className="font-medium mb-1">{t("admin.advancedSettings.resetCard.purgeTitle")}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t("admin.advancedSettings.resetCard.purgeDescription")}
              </p>
            </div>
            <Button variant="outline" onClick={handlePurgeCache} disabled={isPurging}>
              {isPurging ? t("admin.common.purging") : t("admin.advancedSettings.resetCard.purgeButton")}
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg flex flex-col justify-between opacity-70">
            <div>
              <h4 className="font-medium mb-1">{t("admin.advancedSettings.resetCard.syncTitle")}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t("admin.advancedSettings.resetCard.syncDescription")}
              </p>
            </div>
            <Button variant="outline" disabled>{t("admin.advancedSettings.resetCard.syncButton")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
