"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { field } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf } from "@/lib/result";
import { getCurrentUser } from "@/lib/session";
import { updateOwnProfile } from "@/services/profile";

const MAX_PROFILE_IMAGE_SIZE = 256 * 1024;
const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function saveOwnProfileAction(formData: FormData): Promise<void> {
  try {
    await getCurrentUser();
    const upload = formData.get("profileImage");
    let profileImage: string | undefined;

    if (upload instanceof File && upload.size > 0) {
      if (!PROFILE_IMAGE_TYPES.has(upload.type)) {
        throw new Error("Choose a JPG, PNG, or WebP profile picture");
      }
      if (upload.size > MAX_PROFILE_IMAGE_SIZE) {
        throw new Error("Profile pictures must be 256 KB or smaller");
      }
      const base64 = Buffer.from(await upload.arrayBuffer()).toString("base64");
      profileImage = `data:${upload.type};base64,${base64}`;
    }

    await updateOwnProfile({
      phone: field(formData, "phone"),
      bio: field(formData, "bio"),
      ...(profileImage ? { profileImage } : {}),
    });
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/profile", { error: messageOf(error) });
  }
  redirectWith("/profile", { notice: "Employee profile updated" });
}
