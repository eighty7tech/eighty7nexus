"use client";

import { AlignVerticalSpaceAround, FileText, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Settings } from "@/components/admin/settings/types";
import { SettingsTabHeader } from "./settings-tab-header";
import { StickySaveFooter } from "./sticky-save-footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ToggleRow(props: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{props.label}</p>
        {props.description ? (
          <p className="text-sm text-muted-foreground">{props.description}</p>
        ) : null}
      </div>
      <Switch
        checked={props.checked}
        disabled={props.disabled}
        onCheckedChange={props.onChange}
      />
    </div>
  );
}

export function ComplianceSettingsTab(props: {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  updateNestedField: (path: string, value: unknown) => void;
  onSave: () => void | Promise<unknown>;
}) {
  const t = useTranslations();
  const consent = props.settings.compliance?.cookieConsent || {
    enabled: false,
    layout: "bottom-banner",
    theme: "system",
    privacyPolicyUrl: "",
    text: {
      title: "Cookie Consent",
      message:
        "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
      acceptButton: "Accept All",
      declineButton: "Decline Optional",
    },
  };

  return (
    <div className="space-y-6">
      <SettingsTabHeader
        title={t("admin.settings.compliance.title")}
        description={t("admin.settings.compliance.description")}
      />

      <div className="space-y-6 max-w-4xl">
        {/* Cookie Consent Banner Trigger / Activation Card */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <ShieldCheck className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-base">
                {t("admin.settings.compliance.cookieBanner.title")}
              </h3>
            </div>
            <ToggleRow
              label={t("admin.settings.compliance.cookieBanner.enable")}
              description={t(
                "admin.settings.compliance.cookieBanner.enableDescription",
              )}
              checked={Boolean(consent.enabled)}
              onChange={(v) =>
                props.updateNestedField("compliance.cookieConsent.enabled", v)
              }
            />
          </CardContent>
        </Card>

        {consent.enabled ? (
          <>
            {/* Layout & Appearance */}
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <AlignVerticalSpaceAround className="w-5 h-5 text-muted-foreground" />
                  <h4 className="font-semibold text-base">
                    {t("admin.settings.compliance.cookieBanner.layoutTitle")}
                  </h4>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>
                      {t("admin.settings.compliance.cookieBanner.layout")}
                    </Label>
                    <Select
                      value={consent.layout || "bottom-banner"}
                      onValueChange={(value) =>
                        props.updateNestedField(
                          "compliance.cookieConsent.layout",
                          value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-banner">
                          {t(
                            "admin.settings.compliance.cookieBanner.layoutBottom",
                          )}
                        </SelectItem>
                        <SelectItem value="center-modal">
                          {t(
                            "admin.settings.compliance.cookieBanner.layoutModal",
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>
                      {t("admin.settings.compliance.cookieBanner.theme")}
                    </Label>
                    <Select
                      value={consent.theme || "system"}
                      onValueChange={(value) =>
                        props.updateNestedField(
                          "compliance.cookieConsent.theme",
                          value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          {t(
                            "admin.settings.compliance.cookieBanner.themeLight",
                          )}
                        </SelectItem>
                        <SelectItem value="dark">
                          {t(
                            "admin.settings.compliance.cookieBanner.themeDark",
                          )}
                        </SelectItem>
                        <SelectItem value="system">
                          {t(
                            "admin.settings.compliance.cookieBanner.themeSystem",
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content & Text */}
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <h4 className="font-semibold text-base">
                    {t("admin.settings.compliance.cookieBanner.contentTitle")}
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cookie-title">
                      {t("admin.settings.compliance.cookieBanner.bannerTitle")}
                    </Label>
                    <Input
                      id="cookie-title"
                      value={consent.text?.title ?? ""}
                      onChange={(e) =>
                        props.updateNestedField(
                          "compliance.cookieConsent.text.title",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cookie-message">
                      {t("admin.settings.compliance.cookieBanner.message")}
                    </Label>
                    <Textarea
                      id="cookie-message"
                      rows={3}
                      value={consent.text?.message ?? ""}
                      onChange={(e) =>
                        props.updateNestedField(
                          "compliance.cookieConsent.text.message",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cookie-accept">
                        {t(
                          "admin.settings.compliance.cookieBanner.acceptButton",
                        )}
                      </Label>
                      <Input
                        id="cookie-accept"
                        value={consent.text?.acceptButton ?? ""}
                        onChange={(e) =>
                          props.updateNestedField(
                            "compliance.cookieConsent.text.acceptButton",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cookie-decline">
                        {t(
                          "admin.settings.compliance.cookieBanner.declineButton",
                        )}
                      </Label>
                      <Input
                        id="cookie-decline"
                        value={consent.text?.declineButton ?? ""}
                        onChange={(e) =>
                          props.updateNestedField(
                            "compliance.cookieConsent.text.declineButton",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="privacy-policy-url">
                      {t(
                        "admin.settings.compliance.cookieBanner.privacyPolicyUrl",
                      )}
                    </Label>
                    <Input
                      id="privacy-policy-url"
                      placeholder="/policies/privacy"
                      value={consent.privacyPolicyUrl ?? ""}
                      onChange={(e) =>
                        props.updateNestedField(
                          "compliance.cookieConsent.privacyPolicyUrl",
                          e.target.value,
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "admin.settings.compliance.cookieBanner.privacyPolicyHint",
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <StickySaveFooter
        label={t("common.saveSettings") || "Save Settings"}
        isSaving={props.isSaving}
        isDirty={props.isDirty}
        disabled={props.isSaving || !props.isDirty}
        onSave={props.onSave}
      />
    </div>
  );
}
