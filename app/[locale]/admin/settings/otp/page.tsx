"use client";

import { OtpSettingsTab } from "@/components/admin/settings/sections/otp-settings-tab";
import { useAdminSettingsContext } from "@/components/admin/settings/admin-settings-context";
import { SectionLoader } from "@/components/admin/settings/section-loader";

export default function Page() {
  const {
    isSaving,
    dirtySections,
    updateFieldInSection,
    saveSection,
  } = useAdminSettingsContext();

  return (
    <SectionLoader>
      {(loadedSettings) => (
        <OtpSettingsTab
          settings={loadedSettings}
          isSaving={isSaving}
          isDirty={dirtySections.has("otp")}
          updateField={(path, value) => updateFieldInSection("otp", path, value)}
          updateNestedField={(path, value) => updateFieldInSection("otp", path, value)}
          onSave={() =>
            saveSection("otp", {
              otp: loadedSettings.otp,
              sms: loadedSettings.sms,
            })
          }
        />
      )}
    </SectionLoader>
  );
}
