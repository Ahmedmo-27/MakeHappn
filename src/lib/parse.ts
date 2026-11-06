export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function fieldList(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function assertEmail(value: string): string {
  const email = value.toLowerCase().trim();
  if (!EMAIL.test(email)) throw new Error("Enter a valid email address");
  return email;
}

export function assertName(value: string, label: string, max = 80): string {
  const name = value.trim();
  if (!name) throw new Error(`${label} is required`);
  if (name.length > max) throw new Error(`${label} must be ${max} characters or less`);
  return name;
}

export function assertPassword(value: string): string {
  if (value.length < 8) throw new Error("Password must be at least 8 characters");
  if (value.length > 200) throw new Error("Password is too long");
  return value;
}
