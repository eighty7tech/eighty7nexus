"use client";

import { useTranslations } from "next-intl";
import { Loader2, TestTube, Banknote, Webhook } from "lucide-react";
import {
  StripeLogo,
  PayPalLogo,
  RazorpayLogo,
  PaystackLogo,
  PesapalLogo,
  IotecLogo,
  CashOnDeliveryLogo,
} from "./payment-brand-logos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SecretInput } from "@/components/admin/settings/fields/secret-input";
import { useCredentialMeta } from "@/components/admin/settings/fields/use-credential-meta";
import { EnvSourceHint } from "@/components/admin/settings/fields/env-source-hint";
import {
  ModeBadge,
  ProviderCard,
  StatusBadge,
} from "@/components/admin/settings/fields/provider-card";
import type { Settings } from "@/components/admin/settings/types";
import { StickySaveFooter } from "./sticky-save-footer";
import { SettingsTabHeader } from "./settings-tab-header";

type ProviderId =
  | "stripe"
  | "paypal"
  | "razorpay"
  | "paystack"
  | "pesapal"
  | "iotec";

export function PaymentSettingsTab(props: {
  settings: Settings;
  isSaving: boolean;
  isDirty: boolean;
  isTestingPayment: boolean;
  isRegisteringPesapalIpn: boolean;
  updateNestedField: (path: string, value: unknown) => void;
  onSave: () => void | Promise<unknown>;
  onTestConnection: (provider: ProviderId) => void | Promise<unknown>;
  onRegisterPesapalIpn: () => void | Promise<unknown>;
}) {
  const t = useTranslations();
  const {
    settings,
    isSaving,
    isDirty,
    isTestingPayment,
    isRegisteringPesapalIpn,
    updateNestedField,
    onSave,
    onTestConnection,
    onRegisterPesapalIpn,
  } = props;

  const stripe = settings.payment?.stripe;
  const razorpay = settings.payment?.razorpay;
  const paystack = settings.payment?.paystack;
  const pesapal = settings.payment?.pesapal;
  const iotec = settings.payment?.iotec;
  const paypal = settings.payment?.paypal;
  const cod = settings.payment?.cod;

  // Credential values are stripped server-side; presence + masked previews and
  // the test/live key mode arrive via _meta instead.
  const cred = useCredentialMeta(settings);
  const keyModes = settings._meta?.keyModes;
  const stripeMode = keyModes?.stripe ?? null;
  const razorpayMode = keyModes?.razorpay ?? null;
  const paystackMode = keyModes?.paystack ?? null;
  const paypalMode = paypal?.mode === "live" ? "live" : "sandbox";
  const pesapalMode = pesapal?.mode === "live" ? "live" : "sandbox";
  const iotecMode = iotec?.mode === "live" ? "live" : "sandbox";

  // Per-field .env fallback presence (DB still wins when a value is saved).
  const env = settings._meta?.envSources?.payment;

  const stripeConfigured = Boolean(
    (cred("payment.stripe.publishableKey").set || env?.stripe.publishableKey) &&
      (cred("payment.stripe.secretKey").set || env?.stripe.secretKey),
  );
  const razorpayConfigured = Boolean(
    (cred("payment.razorpay.keyId").set || env?.razorpay.keyId) &&
      (cred("payment.razorpay.keySecret").set || env?.razorpay.keySecret),
  );
  const paystackConfigured = Boolean(
    (cred("payment.paystack.publicKey").set || env?.paystack.publicKey) &&
      (cred("payment.paystack.secretKey").set || env?.paystack.secretKey),
  );
  const paypalConfigured = Boolean(
    (cred("payment.paypal.clientId").set || env?.paypal.clientId) &&
      (cred("payment.paypal.clientSecret").set || env?.paypal.clientSecret),
  );
  const pesapalConfigured = Boolean(
    (cred("payment.pesapal.consumerKey").set || env?.pesapal.consumerKey) &&
      (cred("payment.pesapal.consumerSecret").set ||
        env?.pesapal.consumerSecret) &&
      (cred("payment.pesapal.ipnId").set || env?.pesapal.ipnId),
  );
  const iotecConfigured = Boolean(
    (cred("payment.iotec.clientId").set || env?.iotec.clientId) &&
      (cred("payment.iotec.clientSecret").set || env?.iotec.clientSecret) &&
      (cred("payment.iotec.walletId").set || env?.iotec.walletId),
  );

  const renderTestButton = (provider: ProviderId, enabled: boolean) => {
    if (!enabled) return null;
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onTestConnection(provider)}
        disabled={isSaving || isTestingPayment}
      >
        {isTestingPayment ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <TestTube className="h-4 w-4 mr-2" />
        )}
        Test connection
      </Button>
    );
  };

  const enabledCount = [
    stripe?.enabled,
    razorpay?.enabled,
    paystack?.enabled,
    pesapal?.enabled,
    paypal?.enabled,
    cod?.enabled,
  ].filter(Boolean).length;

  return (
    <div className="relative">
      <div className="space-y-6">
        <SettingsTabHeader
          title={t("admin.settings.payment.title")}
          description={t("admin.settings.payment.description")}
          meta={<Badge variant="secondary">{enabledCount} active</Badge>}
        />

        {/* Stripe */}
        <ProviderCard
          logo={<StripeLogo />}
          title={t("admin.settings.payment.stripe.title")}
          description="Accept credit & debit cards globally"
          enabled={stripe?.enabled ?? false}
          onToggle={(c) => updateNestedField("payment.stripe.enabled", c)}
          badges={
            <>
              <StatusBadge configured={stripeConfigured} />
              {stripeMode && <ModeBadge mode={stripeMode} />}
            </>
          }
          testButton={renderTestButton("stripe", stripe?.enabled ?? false)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <SecretInput
                id="stripePublishableKey"
                label={t("admin.settings.payment.stripePublishableKey")}
                value={stripe?.publishableKey || ""}
                onChange={(v) =>
                  updateNestedField("payment.stripe.publishableKey", v)
                }
                onClear={() => updateNestedField("payment.stripe.publishableKey", null)}
                secretSet={cred("payment.stripe.publishableKey").set}
                maskedHint={cred("payment.stripe.publishableKey").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="pk_live_... or pk_test_..."
                helperText="Saved keys are not shown again for security."
                revealTyped
              />
              <EnvSourceHint show={Boolean(env?.stripe.publishableKey)} />
            </div>
            <div className="space-y-2">
              <SecretInput
                id="stripeSecretKey"
                label={t("admin.settings.payment.stripe.secretKey")}
                value={stripe?.secretKey || ""}
                onChange={(v) => updateNestedField("payment.stripe.secretKey", v)}
                onClear={() => updateNestedField("payment.stripe.secretKey", null)}
                secretSet={cred("payment.stripe.secretKey").set}
                maskedHint={cred("payment.stripe.secretKey").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="sk_live_... or sk_test_..."
                helperText="Saved keys are not shown again for security."
              />
              <EnvSourceHint show={Boolean(env?.stripe.secretKey)} />
            </div>
          </div>
          <SecretInput
            id="stripeWebhookSecret"
            label={t("admin.settings.payment.stripeWebhookSecret")}
            value={stripe?.webhookSecret || ""}
            onChange={(v) =>
              updateNestedField("payment.stripe.webhookSecret", v)
            }
            onClear={() => updateNestedField("payment.stripe.webhookSecret", null)}
            secretSet={cred("payment.stripe.webhookSecret").set}
            maskedHint={cred("payment.stripe.webhookSecret").hint}
            placeholderWhenSet="Saved (leave blank to keep)"
            placeholderWhenUnset="whsec_..."
            helperText="Required for handling payment events. Get this from Stripe Dashboard → Developers → Webhooks."
          />
          <EnvSourceHint show={Boolean(env?.stripe.webhookSecret)} />
        </ProviderCard>

        {/* PayPal */}
        <ProviderCard
          logo={<PayPalLogo />}
          title={t("admin.settings.payment.paypal.title")}
          description="Trusted global checkout & wallet"
          enabled={paypal?.enabled ?? false}
          onToggle={(c) => updateNestedField("payment.paypal.enabled", c)}
          badges={
            <>
              <StatusBadge configured={paypalConfigured} />
              <ModeBadge mode={paypalMode} />
            </>
          }
          testButton={renderTestButton("paypal", paypal?.enabled ?? false)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <SecretInput
                id="paypalClientId"
                label={t("admin.settings.payment.paypalClientId")}
                value={paypal?.clientId || ""}
                onChange={(v) => updateNestedField("payment.paypal.clientId", v)}
                onClear={() => updateNestedField("payment.paypal.clientId", null)}
                secretSet={cred("payment.paypal.clientId").set}
                maskedHint={cred("payment.paypal.clientId").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="PayPal client ID"
                helperText="Saved keys are not shown again for security."
                revealTyped
              />
              <EnvSourceHint show={Boolean(env?.paypal.clientId)} />
            </div>
            <div className="space-y-2">
              <SecretInput
                id="paypalClientSecret"
                label={t("admin.settings.payment.paypal.clientSecret")}
                value={paypal?.clientSecret || ""}
                onChange={(v) =>
                  updateNestedField("payment.paypal.clientSecret", v)
                }
                onClear={() => updateNestedField("payment.paypal.clientSecret", null)}
                secretSet={cred("payment.paypal.clientSecret").set}
                maskedHint={cred("payment.paypal.clientSecret").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                helperText="Saved secrets are not shown again for security."
              />
              <EnvSourceHint show={Boolean(env?.paypal.clientSecret)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paypalMode">
                {t("admin.settings.payment.paypalMode")}
              </Label>
              <Select
                value={paypal?.mode}
                onValueChange={(v) => updateNestedField("payment.paypal.mode", v)}
              >
                <SelectTrigger id="paypalMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">
                    {t("admin.settings.payment.paypalSandbox")}
                  </SelectItem>
                  <SelectItem value="live">
                    {t("admin.settings.payment.paypalLive")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <SecretInput
                id="paypalWebhookId"
                label={t("admin.settings.payment.paypalWebhookId")}
                value={paypal?.webhookId || ""}
                onChange={(v) =>
                  updateNestedField("payment.paypal.webhookId", v)
                }
                onClear={() => updateNestedField("payment.paypal.webhookId", null)}
                secretSet={cred("payment.paypal.webhookId").set}
                maskedHint={cred("payment.paypal.webhookId").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="PayPal webhook ID"
                revealTyped
              />
            </div>
          </div>
        </ProviderCard>

        {/* Razorpay */}
        <ProviderCard
          logo={<RazorpayLogo />}
          title="Razorpay"
          description="Popular payment gateway for India"
          enabled={razorpay?.enabled ?? false}
          onToggle={(c) => updateNestedField("payment.razorpay.enabled", c)}
          badges={
            <>
              <StatusBadge configured={razorpayConfigured} />
              {razorpayMode && <ModeBadge mode={razorpayMode} />}
            </>
          }
          testButton={renderTestButton(
            "razorpay",
            razorpay?.enabled ?? false,
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <SecretInput
                id="razorpayKeyId"
                label="Key ID"
                value={razorpay?.keyId || ""}
                onChange={(v) => updateNestedField("payment.razorpay.keyId", v)}
                onClear={() => updateNestedField("payment.razorpay.keyId", null)}
                secretSet={cred("payment.razorpay.keyId").set}
                maskedHint={cred("payment.razorpay.keyId").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="rzp_test_... or rzp_live_..."
                helperText="Saved keys are not shown again for security."
                revealTyped
              />
              <EnvSourceHint show={Boolean(env?.razorpay.keyId)} />
            </div>
            <div className="space-y-2">
              <SecretInput
                id="razorpayKeySecret"
                label="Key Secret"
                value={razorpay?.keySecret || ""}
                onChange={(v) =>
                  updateNestedField("payment.razorpay.keySecret", v)
                }
                onClear={() => updateNestedField("payment.razorpay.keySecret", null)}
                secretSet={cred("payment.razorpay.keySecret").set}
                maskedHint={cred("payment.razorpay.keySecret").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="Key secret"
                helperText="Saved keys are not shown again for security."
              />
              <EnvSourceHint show={Boolean(env?.razorpay.keySecret)} />
            </div>
          </div>
          <SecretInput
            id="razorpayWebhookSecret"
            label="Webhook Secret"
            value={razorpay?.webhookSecret || ""}
            onChange={(v) =>
              updateNestedField("payment.razorpay.webhookSecret", v)
            }
            onClear={() => updateNestedField("payment.razorpay.webhookSecret", null)}
            secretSet={cred("payment.razorpay.webhookSecret").set}
            maskedHint={cred("payment.razorpay.webhookSecret").hint}
            placeholderWhenSet="Saved (leave blank to keep)"
            placeholderWhenUnset="Webhook secret"
            helperText="Saved secrets are not shown again for security."
          />
          <EnvSourceHint show={Boolean(env?.razorpay.webhookSecret)} />
        </ProviderCard>

        {/* Paystack */}
        <ProviderCard
          logo={<PaystackLogo />}
          title="Paystack"
          description="Modern payments for Africa"
          enabled={paystack?.enabled ?? false}
          onToggle={(c) => updateNestedField("payment.paystack.enabled", c)}
          badges={
            <>
              <StatusBadge configured={paystackConfigured} />
              {paystackMode && <ModeBadge mode={paystackMode} />}
            </>
          }
          testButton={renderTestButton(
            "paystack",
            paystack?.enabled ?? false,
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <SecretInput
                id="paystackPublicKey"
                label="Public Key"
                value={paystack?.publicKey || ""}
                onChange={(v) =>
                  updateNestedField("payment.paystack.publicKey", v)
                }
                onClear={() => updateNestedField("payment.paystack.publicKey", null)}
                secretSet={cred("payment.paystack.publicKey").set}
                maskedHint={cred("payment.paystack.publicKey").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="pk_test_... or pk_live_..."
                helperText="Saved keys are not shown again for security."
                revealTyped
              />
              <EnvSourceHint show={Boolean(env?.paystack.publicKey)} />
            </div>
            <div className="space-y-2">
              <SecretInput
                id="paystackSecretKey"
                label="Secret Key"
                value={paystack?.secretKey || ""}
                onChange={(v) =>
                  updateNestedField("payment.paystack.secretKey", v)
                }
                onClear={() => updateNestedField("payment.paystack.secretKey", null)}
                secretSet={cred("payment.paystack.secretKey").set}
                maskedHint={cred("payment.paystack.secretKey").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="sk_test_... or sk_live_..."
                helperText="Saved keys are not shown again for security."
              />
              <EnvSourceHint show={Boolean(env?.paystack.secretKey)} />
            </div>
          </div>
          <div className="pt-2 border-t border-border/40 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Customer Pays Gateway Processing Fees</p>
                <p className="text-xs text-muted-foreground">
                  When enabled, Paystack processing charges (~1.5% for local cards/Momo) will be added to the customer's checkout total.
                </p>
              </div>
              <Switch
                checked={paystack?.passChargesToCustomer ?? false}
                onCheckedChange={(checked) =>
                  updateNestedField("payment.paystack.passChargesToCustomer", checked)
                }
              />
            </div>
          </div>
        </ProviderCard>

        {/* Pesapal */}
        <ProviderCard
          logo={<PesapalLogo />}
          title="Pesapal"
          description="Mobile money and card payments across East Africa"
          enabled={pesapal?.enabled ?? false}
          onToggle={(checked) =>
            updateNestedField("payment.pesapal.enabled", checked)
          }
          badges={
            <>
              <StatusBadge configured={pesapalConfigured} />
              <ModeBadge mode={pesapalMode} />
            </>
          }
          testButton={
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRegisterPesapalIpn()}
                disabled={
                  isSaving ||
                  isDirty ||
                  isTestingPayment ||
                  isRegisteringPesapalIpn
                }
              >
                {isRegisteringPesapalIpn ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Webhook className="mr-2 h-4 w-4" />
                )}
                Register IPN
              </Button>
              {renderTestButton("pesapal", pesapal?.enabled ?? false)}
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <SecretInput
                id="pesapalConsumerKey"
                label="Consumer Key"
                value={pesapal?.consumerKey || ""}
                onChange={(value) =>
                  updateNestedField("payment.pesapal.consumerKey", value)
                }
                onClear={() => updateNestedField("payment.pesapal.consumerKey", null)}
                secretSet={cred("payment.pesapal.consumerKey").set}
                maskedHint={cred("payment.pesapal.consumerKey").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="Pesapal consumer key"
                helperText="Saved keys are not shown again for security."
                revealTyped
              />
              <EnvSourceHint show={Boolean(env?.pesapal.consumerKey)} />
            </div>
            <div className="space-y-2">
              <SecretInput
                id="pesapalConsumerSecret"
                label="Consumer Secret"
                value={pesapal?.consumerSecret || ""}
                onChange={(value) =>
                  updateNestedField("payment.pesapal.consumerSecret", value)
                }
                onClear={() => updateNestedField("payment.pesapal.consumerSecret", null)}
                secretSet={cred("payment.pesapal.consumerSecret").set}
                maskedHint={cred("payment.pesapal.consumerSecret").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="Pesapal consumer secret"
                helperText="Saved secrets are not shown again for security."
              />
              <EnvSourceHint show={Boolean(env?.pesapal.consumerSecret)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pesapalMode">Mode</Label>
              <Select
                value={pesapalMode}
                onValueChange={(value) =>
                  updateNestedField("payment.pesapal.mode", value)
                }
              >
                <SelectTrigger id="pesapalMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
              <EnvSourceHint show={Boolean(env?.pesapal.mode)} />
            </div>
            <div className="space-y-2">
              <SecretInput
                id="pesapalIpnId"
                label="IPN ID"
                value={pesapal?.ipnId || ""}
                onChange={(value) =>
                  updateNestedField("payment.pesapal.ipnId", value)
                }
                onClear={() => updateNestedField("payment.pesapal.ipnId", null)}
                secretSet={cred("payment.pesapal.ipnId").set}
                maskedHint={cred("payment.pesapal.ipnId").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="Registered Pesapal IPN ID"
                revealTyped
              />
              <p className="text-xs text-muted-foreground">
                Register <code>/api/payments/pesapal/ipn</code> as a POST IPN URL,
                then enter the returned ID.
              </p>
              <EnvSourceHint show={Boolean(env?.pesapal.ipnId)} />
            </div>
          </div>
        </ProviderCard>

        {/* ioTec Pay */}
        <ProviderCard
          logo={<IotecLogo />}
          title="ioTec Pay"
          description="MTN & Airtel mobile money and card payments (Uganda)"
          enabled={iotec?.enabled ?? false}
          onToggle={(checked) =>
            updateNestedField("payment.iotec.enabled", checked)
          }
          badges={
            <>
              <StatusBadge configured={iotecConfigured} />
              <ModeBadge mode={iotecMode} />
            </>
          }
          testButton={renderTestButton("iotec", iotec?.enabled ?? false)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <SecretInput
                id="iotecClientId"
                label="Client ID"
                value={iotec?.clientId || ""}
                onChange={(value) =>
                  updateNestedField("payment.iotec.clientId", value)
                }
                onClear={() => updateNestedField("payment.iotec.clientId", null)}
                secretSet={cred("payment.iotec.clientId").set}
                maskedHint={cred("payment.iotec.clientId").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="ioTec client ID"
                helperText="Saved keys are not shown again for security."
                revealTyped
              />
              <EnvSourceHint show={Boolean(env?.iotec.clientId)} />
            </div>
            <div className="space-y-2">
              <SecretInput
                id="iotecClientSecret"
                label="Client Secret"
                value={iotec?.clientSecret || ""}
                onChange={(value) =>
                  updateNestedField("payment.iotec.clientSecret", value)
                }
                onClear={() => updateNestedField("payment.iotec.clientSecret", null)}
                secretSet={cred("payment.iotec.clientSecret").set}
                maskedHint={cred("payment.iotec.clientSecret").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="ioTec client secret"
                helperText="Saved secrets are not shown again for security."
              />
              <EnvSourceHint show={Boolean(env?.iotec.clientSecret)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <SecretInput
                id="iotecWalletId"
                label="Wallet ID"
                value={iotec?.walletId || ""}
                onChange={(value) =>
                  updateNestedField("payment.iotec.walletId", value)
                }
                onClear={() => updateNestedField("payment.iotec.walletId", null)}
                secretSet={cred("payment.iotec.walletId").set}
                maskedHint={cred("payment.iotec.walletId").hint}
                placeholderWhenSet="Saved (leave blank to keep)"
                placeholderWhenUnset="ioTec Pay wallet UUID"
                revealTyped
              />
              <p className="text-xs text-muted-foreground">
                Found in the ioTec Pay portal under your wallet settings.
              </p>
              <EnvSourceHint show={Boolean(env?.iotec.walletId)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iotecMode">Mode</Label>
              <Select
                value={iotecMode}
                onValueChange={(value) =>
                  updateNestedField("payment.iotec.mode", value)
                }
              >
                <SelectTrigger id="iotecMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
              <EnvSourceHint show={Boolean(env?.iotec.mode)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Optional: in the ioTec Pay portal, set the collection callback URL to{" "}
            <code>/api/payments/iotec/callback</code> for instant status updates.
            Payments are confirmed by polling even without it.
          </p>
        </ProviderCard>

        {/* Cash on Delivery */}
        <ProviderCard
          logo={<CashOnDeliveryLogo />}
          title={t("admin.settings.payment.cod.title")}
          description="Let customers pay when their order arrives"
          enabled={cod?.enabled ?? false}
          onToggle={(c) => updateNestedField("payment.cod.enabled", c)}
          badges={
            <Badge variant="outline" className="gap-1">
              <Banknote className="h-3 w-3" />
              Offline
            </Badge>
          }
        >
          <div className="space-y-2">
            <Label htmlFor="codInstructions">
              {t("admin.settings.payment.codInstructions")}
            </Label>
            <Textarea
              id="codInstructions"
              value={cod?.instructions || ""}
              onChange={(e) =>
                updateNestedField("payment.cod.instructions", e.target.value)
              }
              rows={3}
              placeholder="e.g. Please keep exact change ready when the courier arrives."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="codMinOrder">
                {t("admin.settings.payment.codMinOrder")}
              </Label>
              <Input
                id="codMinOrder"
                type="number"
                value={cod?.minOrderAmount || 0}
                onChange={(e) =>
                  updateNestedField(
                    "payment.cod.minOrderAmount",
                    parseFloat(e.target.value),
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codMaxOrder">
                {t("admin.settings.payment.codMaxOrder")}
              </Label>
              <Input
                id="codMaxOrder"
                type="number"
                value={cod?.maxOrderAmount || 0}
                onChange={(e) =>
                  updateNestedField(
                    "payment.cod.maxOrderAmount",
                    parseFloat(e.target.value),
                  )
                }
              />
            </div>
          </div>
        </ProviderCard>
      </div>

      <StickySaveFooter
        label={t("admin.settings.general.save")}
        isSaving={isSaving}
        isDirty={isDirty}
        onSave={onSave}
      />
    </div>
  );
}
