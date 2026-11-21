import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

type ProfileActor = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "leader" | "member";
  title?: string;
  functionalRoles?: string[];
};

function actorQuery(actor: ProfileActor) {
  const alternatives: Record<string, unknown>[] = [];
  if (Types.ObjectId.isValid(actor.id)) alternatives.push({ _id: new Types.ObjectId(actor.id) });
  if (actor.email) alternatives.push({ email: actor.email.toLowerCase() });
  if (alternatives.length === 0) throw new Error("Your employee profile could not be identified");
  return { $or: alternatives };
}

export async function getOwnProfile(actor: ProfileActor) {
  await connectDB();
  const user = await User.findOne(actorQuery(actor))
    .select("name email role title functionalRoles phone bio +profileImage")
    .lean();

  return {
    name: user?.name ?? actor.name,
    email: user?.email ?? actor.email,
    role: user?.role ?? actor.role,
    title: user?.title ?? actor.title ?? "",
    functionalRoles: user?.functionalRoles ?? actor.functionalRoles ?? [],
    phone: user?.phone ?? "",
    bio: user?.bio ?? "",
    profileImage: user?.profileImage ?? "",
  };
}

export async function updateOwnProfile(
  actor: ProfileActor,
  input: { phone: string; bio: string; profileImage?: string },
) {
  await connectDB();
  if (input.profileImage !== undefined) {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.profileImage);
    if (!match) throw new Error("Choose a valid JPG, PNG, or WebP profile picture");
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length === 0 || buffer.length > 256 * 1024 || buffer.toString("base64") !== match[2]) {
      throw new Error("Profile pictures must be 256 KB or smaller");
    }

    const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
    const isWebp =
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";
    if (
      (match[1] === "image/png" && !isPng) ||
      (match[1] === "image/jpeg" && !isJpeg) ||
      (match[1] === "image/webp" && !isWebp)
    ) {
      throw new Error("The selected file is not a valid JPG, PNG, or WebP image");
    }
  }

  const updated = await User.findOneAndUpdate(
    actorQuery(actor),
    {
      $set: {
        phone: input.phone.trim().slice(0, 40),
        bio: input.bio.trim().slice(0, 500),
        ...(input.profileImage !== undefined ? { profileImage: input.profileImage } : {}),
      },
    },
    { returnDocument: "after", runValidators: true },
  )
    .select("name email role title functionalRoles phone bio +profileImage")
    .lean();
  if (!updated) throw new Error("Your employee profile could not be found");

  return {
    name: updated.name,
    email: updated.email,
    role: updated.role,
    title: updated.title ?? "",
    functionalRoles: updated.functionalRoles ?? [],
    phone: updated.phone ?? "",
    bio: updated.bio ?? "",
    profileImage: updated.profileImage ?? "",
  };
}
