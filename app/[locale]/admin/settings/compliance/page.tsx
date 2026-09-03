"use client";

import { SectionLoader } from "@/components/admin/settings/section-loader";
import { useAdminSettingsContext } from "@/components/admin/settings/admin-settings-context";
import { ComplianceSettingsTab } from "@/components/admin/settings/sections/compliance-settings-tab";

export default function Page() {
  const { dirtySections, isSaving, saveSection, updateNestedField } =
    useAdminSettingsContext();

  return (
    <SectionLoader>
      {(loadedSettings) => (
        <ComplianceSettingsTab
          settings={loadedSettings}
          isSaving={isSaving}
          isDirty={dirtySections.has("compliance")}
          updateNestedField={updateNestedField}
          onSave={() => saveSection("compliance", loadedSettings.compliance)}
        />
      )}
    </SectionLoader>
  );
}
