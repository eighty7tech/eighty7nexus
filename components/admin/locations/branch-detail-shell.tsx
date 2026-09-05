"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast-notification";
import { AdminFormStickyHeader } from "@/components/admin/admin-form-sticky-header";
import { DetailFormSkeleton } from "@/components/admin/detail-form-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BranchDetailShellProps {
  locale: string;
  locationId?: string;
  isNew?: boolean;
}

export function BranchDetailShell({ locale, locationId, isNew }: BranchDetailShellProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [fulfillsOnlineOrders, setFulfillsOnlineOrders] = useState(true);
  const [sellsAtCounter, setSellsAtCounter] = useState(true);
  const [pickupArea, setPickupArea] = useState("");
  const [instructions, setInstructions] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (isNew || !locationId) return;

    async function fetchLocation() {
      try {
        const res = await fetch(`/api/admin/locations/${locationId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const l = json.data;
          setName(l.name || "");
          setAddress(l.address || "");
          setIsActive(l.isActive ?? true);
          setIsDefault(l.isDefault ?? false);
          setPickupEnabled(l.pickupEnabled ?? false);
          setFulfillsOnlineOrders(l.fulfillsOnlineOrders ?? true);
          setSellsAtCounter(l.sellsAtCounter ?? true);
          setPickupArea(l.pickupArea || "");
          setInstructions(l.instructions || "");
          setMapsUrl(l.mapsUrl || "");
          setContactEmail(l.contactEmail || "");
          setContactPhone(l.contactPhone || "");
        } else {
          toast.error("Location not found");
          router.push(`/${locale}/admin/locations`);
        }
      } catch (err) {
        toast.error("Failed to load location");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLocation();
  }, [locationId, isNew, locale, router]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("locations.nameRequired"));
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        address,
        isActive,
        isDefault,
        pickupEnabled,
        fulfillsOnlineOrders,
        sellsAtCounter,
        pickupArea,
        instructions,
        mapsUrl,
        contactEmail,
        contactPhone,
      };

      const url = isNew 
        ? `/api/admin/locations` 
        : `/api/admin/locations/${locationId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(isNew ? t("locations.created") : t("locations.updated"));
        if (isNew) {
          router.push(`/${locale}/admin/locations`);
        }
      } else {
        toast.error(json.message || "Failed to save");
      }
    } catch (err) {
      toast.error("Failed to save location");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <DetailFormSkeleton />;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <AdminFormStickyHeader
        title={isNew ? t("locations.addLocation") : name}
        actions={
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t("common.save")}
          </Button>
        }
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="contact">Contact & Location</TabsTrigger>
          <TabsTrigger value="operations">Operations & POS</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Name and status of this branch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("locations.name")}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Downtown Store" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <label className="text-base font-medium">Active Status</label>
                  <p className="text-sm text-muted-foreground">If disabled, this branch will not be visible anywhere.</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <label className="text-base font-medium">Default Branch</label>
                  <p className="text-sm text-muted-foreground">Make this the primary location for inventory.</p>
                </div>
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Email</label>
                  <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Phone</label>
                  <Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("locations.address")}</label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Google Maps URL</label>
                <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operations & Fulfillment</CardTitle>
              <CardDescription>Configure what services this branch provides.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <label className="text-base font-medium">Fulfills Online Orders</label>
                  <p className="text-sm text-muted-foreground">Use stock from this branch to fulfill online deliveries.</p>
                </div>
                <Switch checked={fulfillsOnlineOrders} onCheckedChange={setFulfillsOnlineOrders} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <label className="text-base font-medium">Customer Pickup Enabled</label>
                  <p className="text-sm text-muted-foreground">Allow customers to choose this branch for local pickup.</p>
                </div>
                <Switch checked={pickupEnabled} onCheckedChange={setPickupEnabled} />
              </div>
              {pickupEnabled && (
                <>
                  <div className="space-y-2 mt-4">
                    <label className="text-sm font-medium">Pickup Area Instructions</label>
                    <Input value={pickupArea} onChange={(e) => setPickupArea(e.target.value)} placeholder="e.g. Loading Dock B" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Collection Instructions</label>
                    <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Bring your ID and order confirmation" />
                  </div>
                </>
              )}
              <div className="flex items-center justify-between rounded-lg border p-4 mt-4">
                <div className="space-y-0.5">
                  <label className="text-base font-medium">Point of Sale (POS)</label>
                  <p className="text-sm text-muted-foreground">This branch has physical registers for in-person sales.</p>
                </div>
                <Switch checked={sellsAtCounter} onCheckedChange={setSellsAtCounter} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
