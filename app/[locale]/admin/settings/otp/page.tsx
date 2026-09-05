"use client";

import { OtpSettingsTab } from "@/components/admin/settings/sections/otp-settings-tab";
import { useAdminSettingsContext } from "@/components/admin/settings/admin-settings-context";
import { SectionLoader } from "@/components/admin/settings/section-loader";

export default function Page() {
  const {
    isSaving,
    dirtySections,
    updateFieldInSection,
    saveSections,
    isTestingSms,
    testPhoneNumber,
    setTestPhoneNumber,
    testSms,
  } = useAdminSettingsContext();

  return (
    <SectionLoader>
      {(loadedSettings) => (
        <OtpSettingsTab
          settings={loadedSettings}
          isSaving={isSaving}
          isDirty={dirtySections.has("otp") || dirtySections.has("sms")}
          isTestingSms={isTestingSms}
          testPhoneNumber={testPhoneNumber}
          setTestPhoneNumber={setTestPhoneNumber}
          updateField={(path, value) => {
            const section = path.startsWith("sms.") ? "sms" : "otp";
            updateFieldInSection(section, path, value);
          }}
          updateNestedField={(path, value) => {
            const section = path.startsWith("sms.") ? "sms" : "otp";
            updateFieldInSection(section, path, value);
          }}
          onSave={() =>
            saveSections({
              otp: loadedSettings.otp,
              sms: loadedSettings.sms,
            })
          }
          onTestSms={() => testSms()}
        />
      )}
    </SectionLoader>
  );
}
