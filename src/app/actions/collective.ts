"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { assertName, field, fieldList } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { getCurrentUser } from "@/lib/session";
import { createCollectiveMember } from "@/services/collective";
import { type CollectiveType } from "@/models/CollectiveMember";

export async function createCollectiveMemberAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await getCurrentUser();
    const name = assertName(field(formData, "name"), "Name", 120);
    const type = field(formData, "type") as CollectiveType;
    const specialisms = fieldList(formData, "specialisms");
    const contactPerson = field(formData, "contactPerson");
    const email = field(formData, "email");
    const phone = field(formData, "phone");
    const location = field(formData, "location");
    const notes = field(formData, "notes");

    await createCollectiveMember({
      name,
      type,
      specialisms: specialisms.length > 0 ? specialisms : [field(formData, "specialismInput")].filter(Boolean),
      contactPerson,
      email,
      phone,
      location,
      notes,
      rateAmount: Number(field(formData, "rateAmount")) || 0,
      rateUnit: field(formData, "rateUnit") || "day",
      commercialTerms: field(formData, "commercialTerms"),
      availability: field(formData, "availability"),
      pastWorkNotes: field(formData, "pastWorkNotes"),
    });

    refresh();
    return { ok: true, notice: "Collective partner added" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function createCollectiveMemberFormAction(formData: FormData): Promise<void> {
  const result = await createCollectiveMemberAction(null, formData);
  if (result.ok) {
    redirectWith("/collective", { notice: result.notice });
  } else {
    redirectWith("/collective", { error: result.error });
  }
}
