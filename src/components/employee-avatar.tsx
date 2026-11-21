import Image from "next/image";

export function EmployeeAvatar({
  name,
  profileImage,
  size = 38,
  small = false,
}: {
  name: string;
  profileImage?: string | null;
  size?: number;
  small?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className={`avatar${small ? " sm" : ""}`}
      aria-hidden="true"
      style={{ width: size, height: size, overflow: "hidden", flexShrink: 0 }}
    >
      {profileImage ? (
        <Image
          src={profileImage}
          alt=""
          width={size}
          height={size}
          unoptimized
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : initials}
    </span>
  );
}
