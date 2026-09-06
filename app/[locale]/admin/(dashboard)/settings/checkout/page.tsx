"use client";

import { CheckoutSettingsTab } from "@/components/admin/settings/sections/checkout-settings-tab";
import { useAdminSettingsContext } from "@/components/admin/settings/admin-settings-context";
import { SectionLoader } from "@/components/admin/settings/section-loader";

export default function Page() {
  const {
    isSaving,
    dirtySections,
    updateNestedField,
    saveSection,
  } = useAdminSettingsContext();

  return (
    <SectionLoader>
      {(loadedSettings) => (
        <CheckoutSettingsTab
          settings={loadedSettings}
          isSaving={isSaving}
          isDirty={dirtySections.has("checkout")}
          updateField={updateNestedField}
          // The mock will trigger this onSave when we click save
          onSave={() => saveSection("checkout", {})}
        />
      )}
    </SectionLoader>
  );
}
