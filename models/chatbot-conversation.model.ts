import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatbotConversation extends Document {
  vendorId?: string;
  userId?: string;
  messages: any[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatbotConversationSchema = new Schema<IChatbotConversation>(
  {
    vendorId: { type: String },
    userId: { type: String },
    messages: [{ type: Schema.Types.Mixed }],
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

const ChatbotConversation: Model<IChatbotConversation> =
  mongoose.models.ChatbotConversation || mongoose.model<IChatbotConversation>("ChatbotConversation", ChatbotConversationSchema);

export default ChatbotConversation;
