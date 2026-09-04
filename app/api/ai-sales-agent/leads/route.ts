import { z } from "zod";
import { withApi } from "@/lib/api/handler";
import ChatbotLead from "@/models/chatbot-lead.model";
import { createdResponse } from "@/lib/api/response";

const captureLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
});

export const POST = withApi(
  { auth: "optional" },
  async ({ request }) => {
    const body = await request.json();
    const data = captureLeadSchema.parse(body);

    const lead = await ChatbotLead.create({
      name: data.name,
      email: data.email,
      source: "widget",
      status: "new",
    });

    return createdResponse(
      lead,
      "Lead captured successfully"
    );
  }
);
