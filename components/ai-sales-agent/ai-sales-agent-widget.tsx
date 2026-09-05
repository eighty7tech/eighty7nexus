"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUp, Loader2, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-notification";
import { useCart } from "@/hooks/use-cart";
import { useCurrency } from "@/providers/currency-provider";
import { cn } from "@/lib/utils";
import { trackAddToCart } from "@/lib/analytics/events";
import type {
  AISalesChatAction,
  AISalesChatMessage,
  PublicAISalesAgentConfig,
} from "@/lib/ai-sales-agent/types";
import type { Locale } from "@/config/i18n.config";
import {
  AISalesAssistantAvatar,
  AISalesHeaderIcon,
  AISalesMessageBubble,
} from "./ai-sales-message";

export function AISalesAgentWidget({ locale, hideToggleButton }: { locale: Locale, hideToggleButton?: boolean }) {
  const pathname = usePathname();
  const accountPath = `/${locale}/account`;
  const isAccountRoute =
    pathname === accountPath || pathname.startsWith(`${accountPath}/`);
  const t = useTranslations("aiSalesAgent");
  const { addItem, refreshCart } = useCart();
  const { currency, formatPrice } = useCurrency();
  const [config, setConfig] = React.useState<PublicAISalesAgentConfig | null>(
    null,
  );
  const [open, setOpen] = React.useState(false);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
  const [conversationId, setConversationId] = React.useState<string | undefined>();
  const [messages, setMessages] = React.useState<AISalesChatMessage[]>([]);

  // Load conversation history from local storage on mount
  React.useEffect(() => {
    const savedId = localStorage.getItem("ai_sales_conversation_id");
    if (savedId) {
      setConversationId(savedId);
      const savedMessages = localStorage.getItem(`ai_sales_messages_${savedId}`);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  }, []);

  // Save conversation history when it changes
  React.useEffect(() => {
    if (conversationId) {
      localStorage.setItem("ai_sales_conversation_id", conversationId);
      if (messages.length > 0) {
        localStorage.setItem(`ai_sales_messages_${conversationId}`, JSON.stringify(messages));
      }
    }
  }, [conversationId, messages]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [addedActions, setAddedActions] = React.useState<Set<string>>(new Set());
  const [pendingActions, setPendingActions] = React.useState<Set<string>>(
    new Set(),
  );
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let alive = true;
    fetch("/api/ai-sales-agent/config", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!alive) return;
        if (json?.success) setConfig(json.data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  React.useEffect(() => {
    const handleOpenWidget = (e: Event) => {
      setOpen(true);
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.rect) {
        setAnchorRect(customEvent.detail.rect);
      } else {
        setAnchorRect(null);
      }
    };
    window.addEventListener("ai-sales-agent:open", handleOpenWidget as EventListener);
    return () => {
      window.removeEventListener("ai-sales-agent:open", handleOpenWidget as EventListener);
    };
  }, []);

  if (isAccountRoute) return null;
  if (!config?.enabled) return null;

  const labels = {
    addedToCart: t("addedToCart"),
    orderPayment: t("orderPayment"),
    orderTotal: t("orderTotal"),
    viewOrder: t("viewOrder"),
  };

  const sendMessage = async (override?: string) => {
    const text = (override || input).trim();
    if (!text || loading) return;
    const userMessage: AISalesChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai-sales-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: text, locale }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Chat failed");
      setConversationId(json.data.conversationId);
      setMessages((prev) => [...prev, json.data.message]);
      if (json.data.cartUpdated) await refreshCart();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("chatFailed"));
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: t("errorRetry"),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (
    action: Extract<AISalesChatAction, { type: "add_to_cart" }>,
  ) => {
    const key = `${action.productId}-${action.variantId || "default"}`;
    if (addedActions.has(key) || pendingActions.has(key)) return;

    // Pull the matching product details from the most recent assistant message
    // that exposes a productCards entry for this product.
    const product = [...messages]
      .reverse()
      .flatMap((m) => m.productCards || [])
      .find(
        (p) =>
          p.id === action.productId &&
          (action.variantId ? p.variantId === action.variantId : true),
      );

    setPendingActions((prev) => new Set(prev).add(key));
    try {
      await addItem({
        productId: action.productId,
        variantId: action.variantId,
        quantity: 1,
        price: product?.price ?? 0,
        name: product?.name ?? action.label,
        image: product?.image,
      });
      trackAddToCart({
        currency: currency.code,
        value: product?.price ?? 0,
        items: [
          {
            item_id: action.productId,
            item_name: product?.name ?? action.label,
            item_variant: action.variantId,
            price: product?.price ?? 0,
            quantity: 1,
          },
        ],
      });
      await refreshCart();
      setAddedActions((prev) => new Set(prev).add(key));
      toast.success(t("addedToCart"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("chatFailed"));
    } finally {
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const right = config.widget.position !== "bottom-left";
  const headerGradient = `linear-gradient(135deg, ${config.widget.primaryColor}, ${config.widget.accentColor})`;

  const customPos: React.CSSProperties = {};
  if (anchorRect && typeof window !== "undefined" && window.innerWidth >= 1024) {
    const isRightHalf = anchorRect.left > window.innerWidth / 2;
    if (isRightHalf) {
      customPos.right = `${window.innerWidth - anchorRect.left + 16}px`;
      customPos.left = "auto";
    } else {
      customPos.left = `${anchorRect.right + 16}px`;
      customPos.right = "auto";
    }
    
    // Position vertically centered relative to the tab, so it's strictly "beside" it
    // not above or below it.
    customPos.top = `${anchorRect.top + anchorRect.height / 2}px`;
    customPos.bottom = "auto";
    customPos.transform = "translateY(-50%)";
    customPos.maxHeight = "90vh"; // ensure it doesn't overflow screen if tab is near edges
  }

  const currentTheme = config.widget.widgetTheme || "nexus-modern";
  const isCyber = currentTheme === "nexus-cyber-hud";
  const isGlass = currentTheme === "nexus-glass";
  const isCapsule = currentTheme === "nexus-capsule";

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300",
        !anchorRect || (typeof window !== "undefined" && window.innerWidth < 1024)
          ? `bottom-[calc(4.75rem+env(safe-area-inset-bottom))] xl:bottom-6 ${right ? "right-4 sm:right-6" : "left-4 sm:left-6"}`
          : ""
      )}
      style={customPos}
    >
      {open && (
        <div
          className={cn(
            "mb-3 flex w-[calc(100vw-2rem)] flex-col overflow-hidden transition-all duration-300",
            isGlass &&
              "rounded-[32px] border border-white/20 bg-card/40 backdrop-blur-3xl text-foreground shadow-2xl",
            isCyber &&
              "rounded-md border-2 border-[#77CDCC]/80 bg-black/90 text-emerald-100 shadow-[0_0_35px_rgba(119,205,204,0.2)]",
            isCapsule &&
              "rounded-[40px] border border-border bg-card text-foreground shadow-2xl",
            (!isGlass && !isCyber && !isCapsule) &&
              "rounded-[28px] border border-border bg-background text-foreground shadow-2xl"
          )}
          style={{
            width: `min(${config.widget.width}px, calc(100vw - 2rem))`,
            height: `min(${config.widget.height}px, calc(100vh - 12rem))`,
          }}
        >
          <div className="relative px-4 pt-4">
            <div
              className={cn(
                "flex h-12 items-center justify-between px-5 text-white transition-all",
                isCyber
                  ? "rounded-sm border border-[#77CDCC]/40 bg-[#001a45]/80 shadow-xs font-mono"
                  : isCapsule
                  ? "rounded-full shadow-md"
                  : isGlass
                  ? "rounded-full border border-white/20 bg-white/20 backdrop-blur-xl shadow-md"
                  : "rounded-2xl shadow-sm"
              )}
              style={{
                background:
                  isCyber
                    ? "transparent"
                    : isGlass
                    ? undefined
                    : headerGradient,
              }}
            >
              <div className="flex items-center gap-2">
                {isCyber && (
                  <span className="h-2 w-2 rounded-full bg-[#77CDCC] animate-pulse" />
                )}
                <span className="text-sm font-semibold tracking-wide">
                  {config.widget.headerTitle?.trim() || config.agentName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
                aria-label={t("close")}
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>
            <div className="pointer-events-none absolute left-1/2 top-11 -translate-x-1/2">
              <AISalesHeaderIcon
                avatarUrl={config.widget.avatarUrl}
                faviconUrl={config.faviconUrl}
                primaryColor={config.widget.primaryColor}
                accentColor={config.widget.accentColor}
                agentName={config.agentName}
              />
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-10"
          >
            <div className="flex gap-2">
              <AISalesAssistantAvatar primaryColor={config.widget.primaryColor} currentTheme={currentTheme} />
              <div
                className={cn(
                  "w-fit max-w-[85%] px-4 py-2.5 text-sm leading-relaxed",
                  isCyber
                    ? "rounded-sm border border-[#77CDCC]/30 bg-black/60 text-[#77CDCC] font-mono shadow-[0_0_15px_rgba(119,205,204,0.15)]"
                    : isGlass
                    ? "rounded-2xl rounded-tl-sm border border-white/10 bg-white/10 backdrop-blur-xl text-foreground shadow-md"
                    : isCapsule
                    ? "rounded-3xl rounded-tl-sm bg-muted/40 text-foreground"
                    : "rounded-2xl rounded-tl-sm bg-muted text-foreground"
                )}
              >
                {config.greeting}
              </div>
            </div>

            {messages.map((message) => (
              <AISalesMessageBubble
                key={message.id}
                message={message}
                primaryColor={config.widget.primaryColor}
                formatPrice={formatPrice}
                onAddToCart={handleAddToCart}
                addedActions={addedActions}
                pendingActions={pendingActions}
                labels={labels}
                currentTheme={currentTheme}
              />
            ))}

            {loading && (
              <div className="flex items-center gap-2">
                <AISalesAssistantAvatar primaryColor={config.widget.primaryColor} currentTheme={currentTheme} />
                <div className={cn(
                  "flex items-center gap-1 px-4 py-3",
                  isCyber ? "rounded-sm bg-black/40 border border-[#77CDCC]/30" :
                  isGlass ? "rounded-2xl rounded-tl-sm bg-white/10 backdrop-blur-md" :
                  isCapsule ? "rounded-3xl rounded-tl-sm bg-muted/40" :
                  "rounded-2xl rounded-tl-sm bg-muted"
                )}>
                  <span
                    className={cn("h-1.5 w-1.5 animate-bounce", isCyber ? "rounded-none" : "rounded-full")}
                    style={{ backgroundColor: isCyber ? "#77CDCC" : config.widget.primaryColor, animationDelay: "0ms" }}
                  />
                  <span
                    className={cn("h-1.5 w-1.5 animate-bounce", isCyber ? "rounded-none" : "rounded-full")}
                    style={{ backgroundColor: isCyber ? "#77CDCC" : config.widget.primaryColor, animationDelay: "150ms" }}
                  />
                  <span
                    className={cn("h-1.5 w-1.5 animate-bounce", isCyber ? "rounded-none" : "rounded-full")}
                    style={{ backgroundColor: isCyber ? "#77CDCC" : config.widget.primaryColor, animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="px-4 pb-4">
            <div
              className={cn(
                "flex items-center gap-2 py-1.5 pl-4 pr-1.5 transition-all",
                isCyber
                  ? "rounded-none border-t-2 border-[#77CDCC]/50 bg-black/80 font-mono text-emerald-100 placeholder:text-emerald-100/50"
                  : isGlass
                  ? "rounded-full border border-white/20 bg-white/10 backdrop-blur-2xl text-foreground"
                  : isCapsule
                  ? "rounded-full border-2 bg-muted/30 text-foreground"
                  : "rounded-full border-2 bg-background text-foreground"
              )}
              style={(!isCyber && !isGlass && !isCapsule) ? { borderColor: config.widget.primaryColor } : undefined}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void sendMessage();
                }}
                placeholder={
                  isCyber
                    ? ">> input command..."
                    : t("typeMessage")
                }
                aria-label={t("typeMessage")}
                className="h-9 flex-1 bg-transparent text-sm leading-none outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={loading || !input.trim()}
                aria-label={t("send")}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center transition-opacity disabled:opacity-40",
                  isCyber ? "rounded-none bg-[#77CDCC]/20 text-[#77CDCC] border border-[#77CDCC] hover:bg-[#77CDCC]/40" : 
                  isGlass ? "rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md" :
                  "rounded-full text-white"
                )}
                style={!isCyber && !isGlass ? { backgroundColor: config.widget.primaryColor } : undefined}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                )}
              </button>
            </div>
            {config.widget.showFooterText && config.widget.footerText && (
              <p
                className={cn(
                  "mt-2 text-center text-[11px]",
                  isCyber ? "font-mono text-[#77CDCC]/60" : "text-muted-foreground"
                )}
              >
                {config.widget.footerText}
              </p>
            )}
          </div>
        </div>
      )}

      {!open && !hideToggleButton && (() => {
        const mobileMode = config.widget.mobile?.mode || "floating_circle";
        const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
        if (isMobile && mobileMode === "hidden") return null;

        if (isMobile && mobileMode === "floating_pill") {
          return (
            <Button
              className="h-12 rounded-full shadow-xl px-4 flex items-center gap-2"
              onClick={() => setOpen(true)}
              style={{ background: headerGradient }}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">{config.widget.mobile?.tabLabel || "AI Help"}</span>
            </Button>
          );
        }

        return (
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl"
            onClick={() => setOpen(true)}
            style={{ background: headerGradient }}
          >
            <MessageCircle className="h-6 w-6" />
            <span className="sr-only">{t("open")}</span>
          </Button>
        );
      })()}
    </div>
  );
}
