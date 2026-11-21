import { buildDeclineResponse, inquiryChannel, type InquiryChannel } from "@/lib/domain";

/** Draft apology to the client: an email or WhatsApp message depending on their contact. */
export function inquiryApology(inquiry: {
  clientName: string;
  clientContact: string;
  brandName: string;
  projectName: string;
}): { channel: InquiryChannel; body: string; href: string | null } {
  const channel = inquiryChannel(inquiry.clientContact);
  const message = buildDeclineResponse({
    channel,
    clientName: inquiry.clientName,
    brandName: inquiry.brandName,
    projectName: inquiry.projectName,
    reason: "",
  });
  const digits = inquiry.clientContact.replace(/\D/g, "");
  const href =
    channel === "email"
      ? `mailto:${inquiry.clientContact}?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}`
      : digits
        ? `https://wa.me/${digits}?text=${encodeURIComponent(message.body)}`
        : null;
  return { channel, body: message.body, href };
}
