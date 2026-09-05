"use client";

import * as React from "react";
import Link from "next/link";
import { ImagePlus, Loader2, ShoppingBag, Sparkles } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { toast } from "@/components/ui/toast-notification";
import { cn } from "@/lib/utils";
import type {
  AISalesChatAction,
  AISalesChatMessage,
  AISalesOrderStatusCard,
  AISalesProductCard,
} from "@/lib/ai-sales-agent/types";

export function AISalesHeaderIcon({
  avatarUrl,
  faviconUrl,
  primaryColor,
  accentColor,
  agentName,
}: {
  avatarUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  accentColor: string;
  agentName: string;
}) {
  const src = (avatarUrl?.trim() || faviconUrl?.trim() || "").trim();
  const gradient = `linear-gradient(135deg, ${primaryColor}, ${accentColor})`;
  return (
    <div
      className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-white shadow-lg ring-4 ring-background"
      style={{ background: gradient }}
    >
      {src ? (
        <AppImage
          src={src}
          alt={agentName}
          width={48}
          height={48}
          className="h-full w-full object-cover"
        />
      ) : (
        <Sparkles className="h-5 w-5" />
      )}
    </div>
  );
}

export type AISalesMessageLabels = {
  addedToCart: string;
  orderPayment: string;
  orderTotal: string;
  viewOrder: string;
};

const DEFAULT_LABELS: AISalesMessageLabels = {
  addedToCart: "Added to your cart!",
  orderPayment: "Payment",
  orderTotal: "Total",
  viewOrder: "View order",
};

function ProductPreviewCard({
  product,
  formatPrice,
  flush = false,
  currentTheme,
  primaryColor,
}: {
  product: AISalesProductCard;
  formatPrice: (value: number) => string;
  flush?: boolean;
  currentTheme?: string;
  primaryColor: string;
}) {
  return (
    <Link
      href={product.url}
      className={cn(
        "flex gap-3 p-3 transition-colors",
        flush
          ? "hover:bg-muted/50"
          : currentTheme === "nexus-glass"
          ? "mt-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md"
          : currentTheme === "nexus-cyber-hud"
          ? "mt-2 rounded-none bg-black/40 hover:bg-black/60 border border-[#77CDCC]/30 font-mono"
          : currentTheme === "nexus-capsule"
          ? "mt-2 rounded-3xl bg-muted/40 hover:bg-muted/60"
          : "mt-2 rounded-2xl bg-muted/50 hover:bg-muted"
      )}
    >
      <div 
        className={cn(
          "relative h-20 w-20 shrink-0 overflow-hidden bg-background",
          currentTheme === "nexus-cyber-hud" ? "rounded-sm border border-[#77CDCC]/30" : "rounded-xl"
        )}
      >
        {product.image ? (
          <AppImage
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("line-clamp-1 text-sm font-semibold text-foreground", currentTheme === "nexus-cyber-hud" && "text-[#77CDCC]")}>
          {product.name}
        </div>
        {product.description && (
          <p className={cn("mt-0.5 line-clamp-2 text-xs leading-snug", currentTheme === "nexus-cyber-hud" ? "text-emerald-100/70" : "text-muted-foreground")}>
            {product.description}
          </p>
        )}
        <div className={cn("mt-1 text-sm font-semibold", currentTheme === "nexus-cyber-hud" ? "text-[#77CDCC]" : "text-foreground")}>
          {formatPrice(product.price)}
        </div>
      </div>
    </Link>
  );
}

function OrderPreviewCard({
  order,
  formatPrice,
  labels,
  currentTheme,
}: {
  order: AISalesOrderStatusCard;
  formatPrice: (value: number) => string;
  labels: AISalesMessageLabels;
  currentTheme?: string;
}) {
  return (
    <div className={cn(
      "mt-2 p-3 text-sm",
      currentTheme === "nexus-glass"
        ? "rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
        : currentTheme === "nexus-cyber-hud"
        ? "rounded-sm bg-black/40 border border-[#77CDCC]/30 font-mono text-emerald-100"
        : currentTheme === "nexus-capsule"
        ? "rounded-3xl bg-muted/40"
        : "rounded-2xl bg-muted/50"
    )}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-foreground">#{order.orderNumber}</span>
        <span className={cn(
          "px-2 py-0.5 text-xs",
          currentTheme === "nexus-cyber-hud" ? "rounded-none border border-[#77CDCC]/50 text-[#77CDCC] bg-transparent" : "rounded-full bg-background"
        )}>
          {order.status}
        </span>
      </div>
      <p className={cn("mt-1 text-xs", currentTheme === "nexus-cyber-hud" ? "text-emerald-100/70" : "text-muted-foreground")}>
        {labels.orderPayment}: {order.paymentStatus} · {labels.orderTotal}:{" "}
        {formatPrice(order.total)}
      </p>
      {order.url && (
        <Link
          href={order.url}
          className={cn(
            "mt-3 inline-flex h-8 items-center justify-center px-3 text-xs font-semibold",
            currentTheme === "nexus-cyber-hud" ? "rounded-none border border-[#77CDCC] text-[#77CDCC] bg-transparent hover:bg-[#77CDCC]/10" : "rounded-full bg-background hover:bg-muted"
          )}
        >
          <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
          {labels.viewOrder}
        </Link>
      )}
    </div>
  );
}

function ActionPill({
  action,
  primaryColor,
  onAddToCart,
  addedActions,
  pendingActions,
  fallbackLabel,
  dense = false,
  currentTheme,
}: {
  action: AISalesChatAction;
  primaryColor: string;
  onAddToCart?: (action: Extract<AISalesChatAction, { type: "add_to_cart" }>) => Promise<void>;
  addedActions: Set<string>;
  pendingActions: Set<string>;
  fallbackLabel?: string;
  dense?: boolean;
  currentTheme?: string;
}) {
  const spacing = dense ? "mt-0" : "mt-2";
  const isCyber = currentTheme === "nexus-cyber-hud";
  const isCapsule = currentTheme === "nexus-capsule";
  const isGlass = currentTheme === "nexus-glass";

  if (action.type === "checkout" || action.type === "handoff") {
    const isLink = action.type === "checkout";
    const href = isLink ? action.href : (action.url || "#");
    const Comp = isLink ? Link : "a";
    
    return (
      <Comp
        href={href}
        {...(!isLink ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={cn(
          "flex h-10 w-full items-center justify-center px-4 text-sm font-semibold transition-all hover:opacity-90",
          isCyber ? "rounded-none border border-[#77CDCC] text-[#77CDCC] hover:bg-[#77CDCC]/10" : 
          isGlass ? "rounded-xl border border-white/20 text-white shadow-md backdrop-blur-md" :
          "rounded-full text-white shadow-sm",
          spacing,
        )}
        style={{ backgroundColor: isCyber ? "transparent" : (isGlass ? `${primaryColor}80` : primaryColor) }}
      >
        {action.label || fallbackLabel || (isLink ? "Continue" : "Contact Support")}
      </Comp>
    );
  }

  if (action.type === "capture_lead" || action.type === "ghana_delivery_wizard") {
    return null;
  }

  const key = `${action.productId}-${action.variantId || "default"}`;
  const added = addedActions.has(key);
  const pending = pendingActions.has(key);
  const label = action.label || fallbackLabel || "Add to cart";

  return (
    <button
      type="button"
      disabled={pending || added || !onAddToCart}
      onClick={() => {
        if (!onAddToCart) return;
        void onAddToCart(action as Extract<AISalesChatAction, { type: "add_to_cart" }>);
      }}
      className={cn(
        "flex h-10 w-full items-center justify-center gap-2 border bg-transparent px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-80",
        isCyber ? "rounded-none hover:bg-[#77CDCC]/10 border-[#77CDCC] text-[#77CDCC]" : 
        isGlass ? "rounded-xl hover:bg-white/10 border-white/20 text-white backdrop-blur-md" : 
        "rounded-full hover:bg-muted border-2",
        spacing,
      )}
      style={!isCyber && !isGlass ? { borderColor: primaryColor, color: primaryColor } : undefined}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? label : added ? "Added to your cart!" : label}
    </button>
  );
}

function LeadCaptureForm({ primaryColor, currentTheme }: { primaryColor: string, currentTheme?: string }) {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  const isCyber = currentTheme === "nexus-cyber-hud";
  const isGlass = currentTheme === "nexus-glass";

  if (submitted) {
    return (
      <div className={cn(
        "mt-2 p-4 text-center text-sm",
        isCyber ? "rounded-sm border border-[#77CDCC]/30 bg-black/40 font-mono text-[#77CDCC]" :
        isGlass ? "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white" :
        "rounded-xl bg-muted/50"
      )}>
        <p className="font-medium">Thank you!</p>
        <p className={cn("mt-1 text-xs", isCyber ? "text-[#77CDCC]/70" : isGlass ? "text-white/70" : "text-muted-foreground")}>We&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form
      className={cn(
        "mt-2 space-y-2 p-3",
        isCyber ? "rounded-sm border border-[#77CDCC]/30 bg-black/40 font-mono text-emerald-100" :
        isGlass ? "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white" :
        "rounded-xl bg-muted/50"
      )}
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const res = await fetch("/api/ai-sales-agent/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email }),
          });
          if (res.ok) {
            setSubmitted(true);
          } else {
            const data = await res.json();
            toast.error(data.message || "Failed to capture lead");
          }
        } catch (error) {
          toast.error("An error occurred. Please try again.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <p className={cn("mb-2 text-xs font-semibold", isCyber ? "text-[#77CDCC]" : "text-foreground")}>Please provide your contact details:</p>
      <input
        required
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={cn(
          "w-full px-3 py-1.5 text-sm outline-none transition-colors",
          isCyber ? "rounded-none border border-[#77CDCC]/30 bg-black/40 text-[#77CDCC] placeholder:text-[#77CDCC]/50 focus:border-[#77CDCC]" :
          isGlass ? "rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/50 focus:border-white/40" :
          "rounded-md border border-border bg-background focus:border-primary"
        )}
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={cn(
          "w-full px-3 py-1.5 text-sm outline-none transition-colors",
          isCyber ? "rounded-none border border-[#77CDCC]/30 bg-black/40 text-[#77CDCC] placeholder:text-[#77CDCC]/50 focus:border-[#77CDCC]" :
          isGlass ? "rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/50 focus:border-white/40" :
          "rounded-md border border-border bg-background focus:border-primary"
        )}
      />
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "mt-2 flex h-8 w-full items-center justify-center text-sm font-medium transition-all disabled:opacity-50",
          isCyber ? "rounded-none border border-[#77CDCC] bg-[#77CDCC]/10 text-[#77CDCC] hover:bg-[#77CDCC]/20" :
          isGlass ? "rounded-lg border border-white/20 text-white hover:bg-white/10" :
          "rounded-md text-white hover:opacity-90"
        )}
        style={!isCyber && !isGlass ? { backgroundColor: primaryColor } : undefined}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit"}
      </button>
    </form>
  );
}

function GhanaDeliveryWizardForm({ primaryColor, currentTheme }: { primaryColor: string, currentTheme?: string }) {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const isCyber = currentTheme === "nexus-cyber-hud";
  const isGlass = currentTheme === "nexus-glass";

  if (submitted) {
    return (
      <div className={cn(
        "mt-2 p-4 text-center text-sm",
        isCyber ? "rounded-sm border border-[#77CDCC]/30 bg-black/40 font-mono text-[#77CDCC]" :
        isGlass ? "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white" :
        "rounded-xl bg-muted/50"
      )}>
        <p className="font-medium">Preferences Saved!</p>
        <p className={cn("mt-1 text-xs", isCyber ? "text-[#77CDCC]/70" : isGlass ? "text-white/70" : "text-muted-foreground")}>Your delivery settings have been applied to your session.</p>
      </div>
    );
  }

  return (
    <form
      className={cn(
        "mt-2 space-y-3 p-4",
        isCyber ? "rounded-sm border border-[#77CDCC]/30 bg-black/40 font-mono text-emerald-100" :
        isGlass ? "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white" :
        "rounded-xl bg-muted/50"
      )}
      onSubmit={(e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setSubmitted(true);
        }, 1000);
      }}
    >
      <div className="space-y-1">
        <p className={cn("text-sm font-semibold", isCyber ? "text-[#77CDCC]" : "text-foreground")}>Delivery Logistics Setup</p>
        <p className={cn("text-xs", isCyber ? "text-[#77CDCC]/70" : "text-muted-foreground")}>Select your region for dispatch rider estimates.</p>
      </div>
      
      <select
        required
        className={cn(
          "w-full px-3 py-2 text-sm outline-none transition-colors",
          isCyber ? "rounded-none border border-[#77CDCC]/30 bg-black/40 text-[#77CDCC] focus:border-[#77CDCC]" :
          isGlass ? "rounded-lg border border-white/20 bg-white/5 text-white focus:border-white/40" :
          "rounded-md border border-border bg-background focus:border-primary"
        )}
      >
        <option value="" disabled selected>Select Region...</option>
        <option value="greater_accra">Greater Accra (Same Day)</option>
        <option value="ashanti">Ashanti (1-2 Days)</option>
        <option value="central">Central Region (1-2 Days)</option>
        <option value="other">Other Regions (2-3 Days)</option>
      </select>

      <div className="flex items-start gap-2 pt-1">
        <input type="checkbox" id="install_wizard" className="mt-1" />
        <label htmlFor="install_wizard" className={cn("text-xs cursor-pointer", isCyber ? "text-[#77CDCC]" : "text-foreground")}>
          <span className="font-semibold block">Need Installation Services?</span>
          <span className={cn(isCyber ? "text-[#77CDCC]/70" : "text-muted-foreground")}>Our dispatch agents can assemble & install upon delivery (extra fee applies).</span>
        </label>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "flex h-9 w-full items-center justify-center text-sm font-semibold transition-all disabled:opacity-50",
            isCyber ? "rounded-none border border-[#77CDCC] bg-[#77CDCC]/10 text-[#77CDCC] hover:bg-[#77CDCC]/20" :
            isGlass ? "rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20" :
            "rounded-md text-white hover:opacity-90"
          )}
          style={!isCyber && !isGlass ? { backgroundColor: primaryColor } : undefined}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Continue"}
        </button>
      </div>
    </form>
  );
}

export function AISalesAssistantAvatar({
  primaryColor,
  currentTheme,
}: {
  primaryColor: string;
  currentTheme?: string;
}) {
  const isCyber = currentTheme === "nexus-cyber-hud";
  return (
    <div
      className={cn(
        "mt-1 flex h-7 w-7 shrink-0 items-center justify-center text-white shadow-sm",
        isCyber ? "rounded-none border border-[#77CDCC] bg-[#77CDCC]/20 text-[#77CDCC]" : "rounded-full"
      )}
      style={!isCyber ? { backgroundColor: primaryColor } : undefined}
    >
      <Sparkles className="h-3.5 w-3.5" />
    </div>
  );
}

export function AISalesMessageBubble({
  message,
  primaryColor,
  formatPrice,
  onAddToCart,
  addedActions,
  pendingActions,
  helperText,
  labels = DEFAULT_LABELS,
  currentTheme = "nexus-modern",
}: {
  message: AISalesChatMessage;
  primaryColor: string;
  formatPrice: (value: number) => string;
  onAddToCart?: (action: Extract<AISalesChatAction, { type: "add_to_cart" }>) => Promise<void>;
  addedActions: Set<string>;
  pendingActions: Set<string>;
  helperText?: string;
  labels?: AISalesMessageLabels;
  currentTheme?: string;
}) {
  const isUser = message.role === "user";

  const isCyber = currentTheme === "nexus-cyber-hud";
  const isGlass = currentTheme === "nexus-glass";
  const isCapsule = currentTheme === "nexus-capsule";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            "max-w-[80%] px-4 py-2.5 text-sm font-medium shadow-sm",
            isCyber ? "rounded-none border border-[#77CDCC] bg-[#77CDCC]/20 text-[#77CDCC] font-mono" :
            isGlass ? "rounded-2xl border border-white/20 text-white backdrop-blur-md" :
            isCapsule ? "rounded-3xl rounded-tr-sm text-white" :
            "rounded-2xl rounded-tr-sm text-white"
          )}
          style={!isCyber ? { backgroundColor: isGlass ? `${primaryColor}CC` : primaryColor } : undefined}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <AISalesAssistantAvatar primaryColor={primaryColor} currentTheme={currentTheme} />
      <div className="flex w-full max-w-[85%] flex-col">
        {message.content && (
          <div className={cn(
            "w-fit max-w-full px-4 py-2.5 text-sm leading-relaxed",
            isCyber ? "rounded-sm border border-[#77CDCC]/30 bg-black/40 text-[#77CDCC] font-mono shadow-[0_0_10px_rgba(119,205,204,0.1)]" :
            isGlass ? "rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-xl shadow-md" :
            isCapsule ? "rounded-3xl rounded-tl-sm bg-muted/40 text-foreground" :
            "rounded-2xl rounded-tl-sm bg-muted text-foreground"
          )}>
            {message.content}
          </div>
        )}
        {helperText && (
          <p className={cn(
            "mt-1 px-1 text-[11px] italic",
            isCyber ? "text-[#77CDCC]/60 font-mono" : isGlass ? "text-white/60" : "text-muted-foreground"
          )}>
            {helperText}
          </p>
        )}
        {(() => {
          const productCards = message.productCards || [];
          const actions = message.actions || [];
          const consumed = new Set<number>();

          const findActionFor = (product: AISalesProductCard) => {
            const index = actions.findIndex((action, idx) => {
              if (consumed.has(idx)) return false;
              if (action.type !== "add_to_cart") return false;
              if (action.productId !== product.id) return false;
              if (product.variantId && action.variantId) {
                return action.variantId === product.variantId;
              }
              return true;
            });
            if (index === -1) return undefined;
            consumed.add(index);
            return actions[index] as Extract<AISalesChatAction, { type: "add_to_cart" }>;
          };

          return (
            <>
              {productCards.map((product) => {
                const action = findActionFor(product);
                return (
                  <div
                    key={`${product.id}-${product.variantId || "default"}`}
                    className={cn(
                      "mt-2 overflow-hidden",
                      isCyber ? "rounded-sm border border-[#77CDCC]/30 bg-black/40" :
                      isGlass ? "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md" :
                      isCapsule ? "rounded-3xl bg-muted/40" :
                      "rounded-2xl bg-muted/50"
                    )}
                  >
                    <ProductPreviewCard
                      product={product}
                      formatPrice={formatPrice}
                      currentTheme={currentTheme}
                      primaryColor={primaryColor}
                      flush
                    />
                    {action && (
                      <div className="px-3 pb-3 pt-1">
                        <ActionPill
                          action={action}
                          primaryColor={primaryColor}
                          onAddToCart={onAddToCart}
                          addedActions={addedActions}
                          pendingActions={pendingActions}
                          fallbackLabel={`Add ${product.name} to cart`}
                          currentTheme={currentTheme}
                          dense
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {message.orderCards?.map((order) => (
                <OrderPreviewCard
                  key={order.orderId}
                  order={order}
                  formatPrice={formatPrice}
                  labels={labels}
                  currentTheme={currentTheme}
                />
              ))}
              {actions.map((action, index) => {
                if (consumed.has(index)) return null;
                if (action.type === "capture_lead") {
                  return (
                    <LeadCaptureForm key={`${message.id}-lead-${index}`} primaryColor={primaryColor} currentTheme={currentTheme} />
                  );
                }
                if (action.type === "ghana_delivery_wizard") {
                  return (
                    <GhanaDeliveryWizardForm key={`${message.id}-wizard-${index}`} primaryColor={primaryColor} currentTheme={currentTheme} />
                  );
                }
                const fallbackLabel =
                  action.type === "add_to_cart"
                    ? action.label || "Add to cart"
                    : action.label;
                return (
                  <ActionPill
                    key={`${message.id}-action-${index}`}
                    action={action}
                    primaryColor={primaryColor}
                    onAddToCart={onAddToCart}
                    addedActions={addedActions}
                    pendingActions={pendingActions}
                    fallbackLabel={fallbackLabel}
                    currentTheme={currentTheme}
                  />
                );
              })}
              {message.requiresCsat && (
                <div className={cn(
                  "mt-2 flex gap-2 justify-end",
                  isCyber ? "text-[#77CDCC]/70" : isGlass ? "text-white/70" : "text-muted-foreground"
                )}>
                  <button className={cn(
                    "rounded px-2 py-1 text-[10px] uppercase font-bold transition-colors",
                    isCyber ? "border border-[#77CDCC]/30 hover:bg-[#77CDCC]/20 hover:text-[#77CDCC]" : 
                    isGlass ? "bg-white/10 hover:bg-white/20 hover:text-white" :
                    "bg-muted/50 hover:bg-muted hover:text-foreground"
                  )}>👍 Helpful</button>
                  <button className={cn(
                    "rounded px-2 py-1 text-[10px] uppercase font-bold transition-colors",
                    isCyber ? "border border-[#77CDCC]/30 hover:bg-[#77CDCC]/20 hover:text-[#77CDCC]" : 
                    isGlass ? "bg-white/10 hover:bg-white/20 hover:text-white" :
                    "bg-muted/50 hover:bg-muted hover:text-foreground"
                  )}>👎 Not Helpful</button>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
