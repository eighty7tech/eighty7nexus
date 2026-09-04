import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatbotLead extends Document {
  name: string;
  email: string;
  source: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatbotLeadSchema = new Schema<IChatbotLead>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    source: { type: String, required: true },
    status: { type: String, default: "new" },
  },
  { timestamps: true }
);

const ChatbotLead: Model<IChatbotLead> =
  mongoose.models.ChatbotLead || mongoose.model<IChatbotLead>("ChatbotLead", ChatbotLeadSchema);

export default ChatbotLead;
