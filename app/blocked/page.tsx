import { ShieldAlert } from "lucide-react";
import { getSettings } from "@/models/settings.model";

export const metadata = {
  title: "Access Denied",
};

export default async function BlockedPage() {
  let blockedMessage = "This website is currently not available in your region.";
  
  try {
    const settings = await getSettings();
    if (settings.general.blockedMessage) {
      blockedMessage = settings.general.blockedMessage;
    }
  } catch (error) {
    // Fallback to default message
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Access Denied
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        {blockedMessage}
      </p>
    </div>
  );
}
