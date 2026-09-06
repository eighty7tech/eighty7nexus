const fs = require('fs');

const path = 'locales/en.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

if (!data.admin.common) data.admin.common = {};
data.admin.common.warning = "Warning";
data.admin.common.restoring = "Restoring...";
data.admin.common.purging = "Purging...";

data.admin.advancedSettings.systemBackupCard.details = "The backup is exported as a standard JSON file. Keep this file secure as it contains API keys and sensitive configuration data.";
data.admin.advancedSettings.systemBackupCard.restoreDescription = "Restore settings from a previously downloaded JSON backup file.";
data.admin.advancedSettings.systemBackupCard.uploadButton = "Upload & Restore JSON";

data.admin.advancedSettings.resetCard = {
  title: "Cache & Maintenance",
  description: "Tools to force system synchronization and resolve stale data issues.",
  purgeTitle: "Purge System Cache",
  purgeDescription: "Invalidates all Next.js server caches. Use this if recent changes aren't appearing on the storefront.",
  purgeButton: "Purge Cache",
  syncTitle: "Force Settings Sync (Coming Soon)",
  syncDescription: "Forces all edge nodes to refetch settings from the primary database immediately.",
  syncButton: "Sync Settings"
};

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Advanced translations added to locales/en.json');
