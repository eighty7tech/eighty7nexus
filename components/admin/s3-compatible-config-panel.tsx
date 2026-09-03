"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyRound, Globe, HardDrive, MapPin, Link2 } from "lucide-react";
import { EnvSourceHint } from "@/components/admin/settings/fields/env-source-hint";
import type { CredentialEnvSources } from "@/lib/credentials";

/**
 * Credential form shared by AWS S3, MinIO and DigitalOcean Spaces — the three
 * providers whose fields are the same S3 set. They differ in exactly two ways,
 * both passed in: which regions are on offer, and whether the endpoint is typed
 * by hand (MinIO) or derived from the region (Spaces) / the SDK (AWS).
 *
 * Cloudflare R2 keeps its own panel: it asks for an account ID instead of a
 * region, which is a different question, not a different list.
 */

export interface RegionOption {
  value: string;
  label: string;
}

export type S3PanelField =
  | "endpoint"
  | "region"
  | "bucketName"
  | "accessKeyId"
  | "secretAccessKey"
  | "publicUrl";

interface S3CompatibleConfigPanelProps {
  endpoint?: string;
  region: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
  /**
   * Regions to choose from. Omit for a free-text region box (MinIO, where the
   * value is arbitrary and usually irrelevant).
   */
  regions?: RegionOption[];
  /** Show the endpoint field. MinIO only — everyone else derives it. */
  showEndpoint?: boolean;
  endpointPlaceholder?: string;
  endpointHelp?: string;
  /** Explains what the derived/expected public URL looks like. */
  publicUrlHelp?: string;
  envSources?: CredentialEnvSources["storage"];
  /** Masked previews of the saved credentials, keyed by field. */
  credentialHints?: { accessKeyId?: string; secretAccessKey?: string };
  onChange: (field: S3PanelField, value: string) => void;
}

export function S3CompatibleConfigPanel({
  endpoint,
  region,
  bucketName,
  accessKeyId,
  secretAccessKey,
  publicUrl,
  regions,
  showEndpoint = false,
  endpointPlaceholder,
  endpointHelp,
  publicUrlHelp,
  envSources,
  credentialHints,
  onChange,
}: S3CompatibleConfigPanelProps) {
  const t = useTranslations();

  return (
    <>
      {showEndpoint && (
        <div className="space-y-1.5 md:col-span-2">
          <Label
            htmlFor="endpoint"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"
          >
            <Link2 className="h-3 w-3" />
            {t("admin.settings.storage.endpoint")}
          </Label>
          <Input
            id="endpoint"
            value={endpoint || ""}
            onChange={(e) => onChange("endpoint", e.target.value)}
            placeholder={endpointPlaceholder}
            className="bg-background font-mono text-sm"
          />
          {endpointHelp && (
            <p className="text-[11px] text-muted-foreground/70">
              {endpointHelp}
            </p>
          )}
          <EnvSourceHint show={Boolean(envSources?.endpoint)} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="region"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"
        >
          <MapPin className="h-3 w-3" />
          {t("admin.settings.storage.region")}
        </Label>
        {regions ? (
          <Select
            value={region}
            onValueChange={(value) => onChange("region", value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue
                placeholder={t("admin.settings.storage.placeholder.region")}
              />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="region"
            value={region}
            onChange={(e) => onChange("region", e.target.value)}
            placeholder="us-east-1"
            className="bg-background font-mono text-sm"
          />
        )}
        <EnvSourceHint show={Boolean(envSources?.region)} />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="bucketName"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"
        >
          <HardDrive className="h-3 w-3" />
          {t("admin.settings.storage.bucketName")}
        </Label>
        <Input
          id="bucketName"
          value={bucketName}
          onChange={(e) => onChange("bucketName", e.target.value)}
          placeholder={t("admin.settings.storage.placeholder.bucket")}
          className="bg-background"
        />
        <EnvSourceHint show={Boolean(envSources?.bucketName)} />
      </div>

      {/* Credentials */}
      <div className="md:col-span-2">
        <div className="h-px bg-border my-1" />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="accessKeyId"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"
        >
          <KeyRound className="h-3 w-3" />
          {t("admin.settings.storage.accessKeyId")}
        </Label>
        <Input
          id="accessKeyId"
          value={accessKeyId}
          onChange={(e) => onChange("accessKeyId", e.target.value)}
          placeholder={
            credentialHints?.accessKeyId ||
            t("admin.settings.storage.placeholder.accessKeyId")
          }
          className="bg-background font-mono text-sm"
        />
        <EnvSourceHint show={Boolean(envSources?.accessKeyId)} />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="secretAccessKey"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"
        >
          <KeyRound className="h-3 w-3" />
          {t("admin.settings.storage.secretAccessKey")}
        </Label>
        <Input
          id="secretAccessKey"
          type="password"
          value={secretAccessKey}
          onChange={(e) => onChange("secretAccessKey", e.target.value)}
          placeholder={
            credentialHints?.secretAccessKey ||
            t("admin.settings.storage.placeholder.secretKey")
          }
          className="bg-background"
        />
        <EnvSourceHint show={Boolean(envSources?.secretAccessKey)} />
      </div>

      {/* Public URL */}
      <div className="md:col-span-2">
        <div className="h-px bg-border my-1" />
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <Label
          htmlFor="publicUrl"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"
        >
          <Globe className="h-3 w-3" />
          {t("admin.settings.storage.publicUrl")}
        </Label>
        <Input
          id="publicUrl"
          value={publicUrl || ""}
          onChange={(e) => onChange("publicUrl", e.target.value)}
          placeholder={t("admin.settings.storage.placeholder.cdnUrl")}
          className="bg-background"
        />
        <p className="text-[11px] text-muted-foreground/70">
          {publicUrlHelp ?? t("admin.settings.storage.help.cloudfront")}
        </p>
        <EnvSourceHint show={Boolean(envSources?.publicUrl)} />
      </div>
    </>
  );
}

export const AWS_REGIONS: RegionOption[] = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "eu-central-1", label: "Europe (Frankfurt)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
];

/**
 * DigitalOcean datacenters that host Spaces. The slug is also the endpoint
 * host (`<slug>.digitaloceanspaces.com`), so this list is what decides where
 * the bucket is reached — not just a label.
 */
export const SPACES_REGIONS: RegionOption[] = [
  { value: "nyc3", label: "New York (nyc3)" },
  { value: "sfo3", label: "San Francisco (sfo3)" },
  { value: "ams3", label: "Amsterdam (ams3)" },
  { value: "sgp1", label: "Singapore (sgp1)" },
  { value: "fra1", label: "Frankfurt (fra1)" },
  { value: "syd1", label: "Sydney (syd1)" },
  { value: "blr1", label: "Bangalore (blr1)" },
  { value: "tor1", label: "Toronto (tor1)" },
];
