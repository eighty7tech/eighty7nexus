import { connectDB } from "@/lib/db";
import { Vendor } from "@/models";
import ChatbotConversation from "@/models/chatbot-conversation.model";
import { ValidationError } from "@/lib/api/errors";
import { successResponse } from "@/lib/api/response";
import { rateLimitByUser } from "@/lib/api/rate-limit-middleware";
import {
  AI_SALES_AGENT_MODEL_IDS,
  AI_SALES_AGENT_REASONING_EFFORTS,
  AI_SALES_AGENT_TONES,
} from "@/lib/ai-sales-agent/models";
import { withApi } from "@/lib/api/handler";

const ALLOWED_MODELS = new Set<string>(AI_SALES_AGENT_MODEL_IDS);
const ALLOWED_TONES = new Set<string>(AI_SALES_AGENT_TONES);
const ALLOWED_REASONING = new Set<string>(AI_SALES_AGENT_REASONING_EFFORTS);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function sanitizeUpdate(data: unknown) {
  if (!isPlainObject(data)) throw new ValidationError("Invalid AI settings payload");
  const next: Record<string, unknown> = {};
  const copyString = (key: string, max: number) => {
    if (data[key] === undefined) return;
    if (typeof data[key] !== "string") throw new ValidationError(`Invalid ${key}`);
    next[key] = (data[key] as string).slice(0, max);
  };

  if (data.enabled !== undefined) next.enabled = Boolean(data.enabled);
  if (data.provider === "custom") {
    next.provider = "custom";
    copyString("customBaseUrl", 200);
    copyString("customApiKey", 200);
    copyString("customModel", 100);
  } else {
    next.provider = typeof data.provider === "string" ? data.provider : "openai";
  }
  
  if (data.model !== undefined) {
    if (typeof data.model !== "string" || !ALLOWED_MODELS.has(data.model)) {
      throw new ValidationError("Invalid model");
    }
    next.model = data.model;
  }
  if (data.temperature !== undefined) {
    const value = Number(data.temperature);
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new ValidationError("Invalid temperature");
    }
    next.temperature = value;
  }
  if (data.reasoningEffort !== undefined) {
    if (
      typeof data.reasoningEffort !== "string" ||
      !ALLOWED_REASONING.has(data.reasoningEffort)
    ) {
      throw new ValidationError("Invalid reasoning effort");
    }
    next.reasoningEffort = data.reasoningEffort;
  }
  if (data.maxRecommendations !== undefined) {
    const value = Number(data.maxRecommendations);
    if (!Number.isFinite(value) || value < 1 || value > 8) {
      throw new ValidationError("Invalid recommendation limit");
    }
    next.maxRecommendations = Math.round(value);
  }
  if (data.tone !== undefined) {
    if (typeof data.tone !== "string" || !ALLOWED_TONES.has(data.tone)) {
      throw new ValidationError("Invalid tone");
    }
    next.tone = data.tone;
  }
  copyString("agentName", 80);
  copyString("greeting", 500);
  copyString("instructions", 3000);
  copyString("escalationMessage", 500);

  if (isPlainObject(data.widget)) {
    const clamp = (raw: unknown, min: number, max: number, fallback: number) => {
      const value = Number(raw);
      if (!Number.isFinite(value)) return fallback;
      return Math.round(Math.min(Math.max(value, min), max));
    };
    next.widget = {
      position: data.widget.position === "bottom-left" ? "bottom-left" : "bottom-right",
      primaryColor: typeof data.widget.primaryColor === "string" ? data.widget.primaryColor.slice(0, 40) : "#7c3aed",
      accentColor: typeof data.widget.accentColor === "string" ? data.widget.accentColor.slice(0, 40) : "#a855f7",
      avatarUrl: typeof data.widget.avatarUrl === "string" ? data.widget.avatarUrl.slice(0, 500) : "",
      footerText: typeof data.widget.footerText === "string" ? data.widget.footerText.slice(0, 120) : "Powered by AI",
      headerTitle: typeof data.widget.headerTitle === "string" ? data.widget.headerTitle.slice(0, 60) : "",
      width: clamp(data.widget.width, 320, 640, 400),
      height: clamp(data.widget.height, 420, 900, 680),
      showFooterText: data.widget.showFooterText === undefined ? true : Boolean(data.widget.showFooterText),
      widgetTheme: typeof data.widget.widgetTheme === "string" ? data.widget.widgetTheme : "nexus-modern",
      mobile: isPlainObject(data.widget.mobile) ? {
        mode: typeof data.widget.mobile.mode === "string" ? data.widget.mobile.mode : "floating_circle",
        tabLabel: typeof data.widget.mobile.tabLabel === "string" ? data.widget.mobile.tabLabel : "AI Help",
        tabIcon: typeof data.widget.mobile.tabIcon === "string" ? data.widget.mobile.tabIcon : "Bot",
        position: typeof data.widget.mobile.position === "string" ? data.widget.mobile.position : "bottom-right",
        autoOpen: Boolean(data.widget.mobile.autoOpen),
      } : undefined
    };
  }

  if (isPlainObject(data.capabilities)) {
    next.capabilities = {
      productQA: Boolean(data.capabilities.productQA),
      recommendations: Boolean(data.capabilities.recommendations),
      cartActions: Boolean(data.capabilities.cartActions),
      checkoutHandoff: Boolean(data.capabilities.checkoutHandoff),
      orderStatus: Boolean(data.capabilities.orderStatus),
    };
  }
  
  if (isPlainObject(data.knowledgeBase)) {
    next.knowledgeBase = {
      businessProfile: typeof data.knowledgeBase.businessProfile === "string" ? data.knowledgeBase.businessProfile : "",
      targetMarket: typeof data.knowledgeBase.targetMarket === "string" ? data.knowledgeBase.targetMarket : "",
      serviceAreas: typeof data.knowledgeBase.serviceAreas === "string" ? data.knowledgeBase.serviceAreas : "",
      industriesServed: typeof data.knowledgeBase.industriesServed === "string" ? data.knowledgeBase.industriesServed : "",
      techStack: typeof data.knowledgeBase.techStack === "string" ? data.knowledgeBase.techStack : "",
      marketingServices: typeof data.knowledgeBase.marketingServices === "string" ? data.knowledgeBase.marketingServices : "",
      socialMediaNote: typeof data.knowledgeBase.socialMediaNote === "string" ? data.knowledgeBase.socialMediaNote : "",
      uniqueSellingPoints: typeof data.knowledgeBase.uniqueSellingPoints === "string" ? data.knowledgeBase.uniqueSellingPoints : "",
      pricingNote: typeof data.knowledgeBase.pricingNote === "string" ? data.knowledgeBase.pricingNote : "",
    };
  }
  
  if (isPlainObject(data.leads)) {
    next.leads = {
      enabled: Boolean(data.leads.enabled),
      notifyEmail: typeof data.leads.notifyEmail === "string" ? data.leads.notifyEmail : "",
      triggerAfter: typeof data.leads.triggerAfter === "number" ? data.leads.triggerAfter : 3,
    };
  }
  
  if (isPlainObject(data.handoff)) {
    next.handoff = {
      enabled: Boolean(data.handoff.enabled),
      triggerAfter: typeof data.handoff.triggerAfter === "number" ? data.handoff.triggerAfter : 2,
      whatsapp: typeof data.handoff.whatsapp === "string" ? data.handoff.whatsapp : "",
      whatsappMessage: typeof data.handoff.whatsappMessage === "string" ? data.handoff.whatsappMessage : "",
      email: typeof data.handoff.email === "string" ? data.handoff.email : "",
      emailSubject: typeof data.handoff.emailSubject === "string" ? data.handoff.emailSubject : "",
      phone: typeof data.handoff.phone === "string" ? data.handoff.phone : "",
      customChannelUrl: typeof data.handoff.customChannelUrl === "string" ? data.handoff.customChannelUrl : "",
      customChannelLabel: typeof data.handoff.customChannelLabel === "string" ? data.handoff.customChannelLabel : "Live chat",
      showDirections: Boolean(data.handoff.showDirections),
    };
  }

  if (Array.isArray(data.faq)) {
    const MAX_ENTRIES = 50;
    next.faq = data.faq
      .slice(0, MAX_ENTRIES)
      .map((raw) => (isPlainObject(raw) ? raw : null))
      .filter((entry): entry is Record<string, unknown> => entry !== null)
      .map((entry) => ({
        question:
          typeof entry.question === "string" ? entry.question.slice(0, 300) : "",
        answer:
          typeof entry.answer === "string" ? entry.answer.slice(0, 2000) : "",
        tags: Array.isArray(entry.tags)
          ? entry.tags
              .filter((tag): tag is string => typeof tag === "string")
              .map((tag) => tag.trim().slice(0, 40))
              .filter(Boolean)
              .slice(0, 10)
          : [],
      }))
      .filter((entry) => entry.question.trim() && entry.answer.trim());
  }

  return next;
}

import { requireApprovedVendorByUserId } from "@/lib/vendor-guard";

export const GET = withApi(
  { auth: "user" },
  async ({ session }) => {
    await connectDB();
    const vendor = await requireApprovedVendorByUserId(session.user.id);
    if (!vendor) {
      return successResponse({
        settings: {},
        configured: false,
        stats: { totalConversations: 0, totalMessages: 0, totalActions: 0, activeConversations: 0, conversationsLast7Days: 0, conversationsLast30Days: 0 },
        conversations: []
      });
    }

    const now = new Date();
    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

    const [
      conversations,
      totals,
      recent7Count,
      recent30Count,
      activeCount,
    ] = await Promise.all([
      ChatbotConversation.find({ vendorId: vendor._id })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("sessionId userId status messages createdAt updatedAt")
        .lean(),
      ChatbotConversation.aggregate([
        { $match: { vendorId: vendor._id } },
        {
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            totalMessages: { $sum: { $size: { $ifNull: ["$messages", []] } } },
          },
        },
      ]),
      ChatbotConversation.countDocuments({ vendorId: vendor._id, updatedAt: { $gte: last7Days } }),
      ChatbotConversation.countDocuments({ vendorId: vendor._id, updatedAt: { $gte: last30Days } }),
      ChatbotConversation.countDocuments({ vendorId: vendor._id, status: "active" }),
    ]);

    const stats = (totals[0] as any) || {
      totalConversations: 0,
      totalMessages: 0,
    };

    return successResponse({
      settings: vendor.aiSalesAgent || {},
      configured: true, // We assume vendors don't need a global API key, it uses the platform one unless custom
      stats: {
        totalConversations: stats.totalConversations,
        totalMessages: stats.totalMessages,
        totalActions: 0, // Not tracking actions in ChatbotConversation currently
        activeConversations: activeCount,
        conversationsLast7Days: recent7Count,
        conversationsLast30Days: recent30Count,
      },
      conversations: conversations.map((conv: any) => ({
        id: String(conv._id),
        sessionId: conv.sessionId,
        userId: conv.userId ? String(conv.userId) : undefined,
        status: conv.status,
        lastMessage: conv.messages?.[conv.messages.length - 1]?.content || "",
        messageCount: conv.messages?.length || 0,
        actionCount: 0,
        lastMessageAt: conv.updatedAt,
        updatedAt: conv.updatedAt,
      })),
    });
  }
);

export const PUT = withApi(
  { auth: "user", demo: "block-mutations" },
  async ({ request, session }) => {
    await rateLimitByUser(
      request,
      session.user.id,
      "vendor:ai-sales-agent:update",
      "moderate",
      session.user.role,
    );

    await connectDB();
    const body = (await request.json()) as unknown;
    const data = isPlainObject(body) && "settings" in body ? body.settings : body;
    const update = sanitizeUpdate(data);

    let vendor = await requireApprovedVendorByUserId(session.user.id);
    if (!vendor) throw new ValidationError("Vendor not found");
    
    const current = vendor.aiSalesAgent || {};
    const merged = {
      ...current,
      ...update,
      widget: {
        ...current.widget,
        ...(isPlainObject(update.widget) ? update.widget : {}),
      },
      capabilities: {
        ...current.capabilities,
        ...(isPlainObject(update.capabilities) ? update.capabilities : {}),
      },
    };
    
    vendor.set("aiSalesAgent", merged);
    vendor.markModified("aiSalesAgent");
    await vendor.save();

    return successResponse({
      settings: vendor.aiSalesAgent,
      configured: true,
    });
  }
);
