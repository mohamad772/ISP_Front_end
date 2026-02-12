export function normalizePhone10(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(0, 10);
}

export function isValidPhone10(value: string): boolean {
  return /^\d{10}$/.test(value);
}
