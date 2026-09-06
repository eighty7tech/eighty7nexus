const fs = require('fs');

const path = 'locales/en.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

if (!data.admin) data.admin = {};

data.admin.login = {
  title: "Admin Portal",
  description: "Sign in to access the secure administrative dashboard.",
  invalidEmail: "Invalid email address",
  passwordRequired: "Password is required",
  invalidCredentials: "Invalid credentials",
  unauthorized: "Unauthorized: This portal is strictly for administrators.",
  welcomeBack: "Welcome back, Admin",
  unexpectedError: "An unexpected error occurred.",
  emailLabel: "Admin Email",
  emailPlaceholder: "admin@example.com",
  passwordLabel: "Password",
  passwordPlaceholder: "••••••••",
  verifying: "Verifying Identity...",
  submitButton: "Access Dashboard",
  securedBy: "Secured by 256-bit encryption"
};

data.admin.systemManagement = {
  title: "System Admins",
  description: "Manage administrators and their specific system permissions.",
  searchPlaceholder: "Search admins...",
  newAdminButton: "New Admin",
  nameColumn: "Admin",
  roleColumn: "Role",
  statusColumn: "Status",
  joinedColumn: "Joined",
  actionsColumn: "Actions",
  editAction: "Edit Access",
  revokeAction: "Revoke Access",
  deleteConfirmTitle: "Revoke Admin Access?",
  deleteConfirmDesc: "This will remove all administrative privileges for this user. They will only have standard user access.",
  modalAddTitle: "Add Administrator",
  modalEditTitle: "Edit Administrator",
  modalDesc: "Configure administrative access and specific permissions for this user.",
  userLabel: "User",
  userPlaceholder: "Search for a registered user...",
  roleLabel: "Role Level",
  rolePlaceholder: "Select admin role",
  permissionsLabel: "Granular Permissions",
  permissionsDesc: "Select specific access rights for this administrator.",
  selectAllPermissions: "Select All Permissions",
  cancelButton: "Cancel",
  saveButton: "Save Changes"
};

data.admin.advancedSettings = {
  title: "Advanced System Configurations",
  description: "Manage core system settings, backups, and critical overrides. Proceed with caution.",
  systemBackupCard: {
    title: "System Configuration Backup",
    description: "Export or restore the entire system configuration. This includes all active settings, thresholds, and keys.",
    downloadButton: "Download Full Config Backup",
    downloading: "Generating Backup...",
    restoreTitle: "Restore Configuration",
    restoreWarning: "Warning: This will overwrite all current system settings. This action cannot be undone.",
    restoreButton: "Upload & Restore Config",
    restoring: "Restoring Configuration..."
  },
  resetCard: {
    title: "Factory Reset Options",
    description: "Reset specific modules to their factory default configurations.",
    button: "Reset Module Configuration",
    placeholder: "Select module to reset"
  }
};

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Translations added to locales/en.json');
