/**
 * Formats a number as Kenyan Shillings: e.g. KSh 1,250
 */
export function formatKES(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString('en-KE')}`;
}

/**
 * Formats standard phone number to Kenyan format: e.g. +254 712 345 678 or 0712 345 678
 */
export function formatKenyanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) {
    return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Formats date into readable format: e.g. 24 Sep 2026, 14:30
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Generates unique order number: e.g. BW-84291
 */
export function generateOrderNumber(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `BW-${randomNum}`;
}
