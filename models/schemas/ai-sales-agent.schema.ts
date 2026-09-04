import { Schema } from "mongoose";

export const AISalesAgentSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: [
        "openai",
        "anthropic",
        "ollama",
        "groq",
        "deepseek",
        "mistral",
        "kiro",
        "rules",
        "custom",
      ],
      default: "openai",
    },
    customBaseUrl: String,
    customApiKey: String,
    customModel: String,
    model: {
      type: String,
      enum: ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4.1-mini"],
      default: "gpt-5-mini",
    },
    temperature: { type: Number, default: 0.3, min: 0, max: 1 },
    reasoningEffort: {
      type: String,
      enum: ["minimal", "low", "medium", "high"],
      default: "minimal",
    },
    maxRecommendations: { type: Number, default: 4, min: 1, max: 8 },
    agentName: { type: String, default: "Sales AI" },
    greeting: {
      type: String,
      default: "Hi! I can help you find products, compare options, add items to your cart, and check order status.",
    },
    tone: {
      type: String,
      enum: ["friendly", "professional", "playful", "luxury"],
      default: "friendly",
    },
    instructions: { type: String, default: "" },
    escalationMessage: {
      type: String,
      default: "I can connect you with the store team for anything that needs a human review.",
    },
    widget: {
      type: new Schema(
        {
          position: {
            type: String,
            enum: ["bottom-right", "bottom-left"],
            default: "bottom-right",
          },
          primaryColor: { type: String, default: "#7c3aed" },
          accentColor: { type: String, default: "#a855f7" },
          widgetTheme: {
            type: String,
            enum: [
              "nexus-modern",
              "genetic-neural",
              "helix-synth",
              "quantum-sentience",
              "aether-core",
            ],
            default: "nexus-modern",
          },
          avatarUrl: String,
          footerText: { type: String, default: "Powered by AI" },
          headerTitle: { type: String, default: "" },
          width: { type: Number, default: 400, min: 320, max: 640 },
          height: { type: Number, default: 680, min: 420, max: 900 },
          showFooterText: { type: Boolean, default: true },
          mobile: {
            type: new Schema(
              {
                mode: {
                  type: String,
                  enum: ["hidden", "floating_pill", "floating_circle", "bottom_bar_tab"],
                  default: "floating_circle",
                },
                tabLabel: { type: String, default: "AI Help" },
                tabIcon: { type: String, default: "Bot" },
                position: {
                  type: String,
                  enum: ["bottom-right", "bottom-left", "bottom-center"],
                  default: "bottom-right",
                },
                autoOpen: { type: Boolean, default: false },
              },
              { _id: false }
            ),
            default: () => ({}),
          },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    capabilities: {
      type: new Schema(
        {
          productQA: { type: Boolean, default: true },
          recommendations: { type: Boolean, default: true },
          cartActions: { type: Boolean, default: true },
          checkoutHandoff: { type: Boolean, default: true },
          orderStatus: { type: Boolean, default: true },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    faq: {
      type: [
        new Schema(
          {
            question: { type: String, default: "" },
            answer: { type: String, default: "" },
            tags: { type: [String], default: [] },
          },
          { _id: false }
        ),
      ],
      default: () => [],
    },
    knowledgeBase: {
      type: new Schema(
        {
          businessProfile: { type: String, default: "" },
          targetMarket: { type: String, default: "" },
          serviceAreas: { type: String, default: "" },
          industriesServed: { type: String, default: "" },
          techStack: { type: String, default: "" },
          marketingServices: { type: String, default: "" },
          socialMediaNote: { type: String, default: "" },
          uniqueSellingPoints: { type: String, default: "" },
          pricingNote: { type: String, default: "" },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    leads: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          notifyEmail: { type: String, default: "" },
          triggerAfter: { type: Number, default: 3 },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    handoff: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          triggerAfter: { type: Number, default: 2 },
          whatsapp: { type: String, default: "" },
          whatsappMessage: { type: String, default: "" },
          email: { type: String, default: "" },
          emailSubject: { type: String, default: "" },
          phone: { type: String, default: "" },
          customChannelUrl: { type: String, default: "" },
          customChannelLabel: { type: String, default: "Live chat" },
          showDirections: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { _id: false }
);
