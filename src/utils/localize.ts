/**
 * Returns the localized name for a leave type based on the current language.
 * Falls back to the English `name` if no translation is available.
 */
export function localizedLeaveTypeName(
  leaveType: { name?: string; name_tr?: string } | null | undefined,
  language: string
): string {
  if (!leaveType) return 'N/A';
  if (language === 'tr' && leaveType.name_tr) return leaveType.name_tr;
  return leaveType.name || 'N/A';
}

/**
 * Returns the localized name from a balance summary object.
 */
export function localizedBalanceName(
  balance: { leave_type_name: string; leave_type_name_tr?: string },
  language: string
): string {
  if (language === 'tr' && balance.leave_type_name_tr) return balance.leave_type_name_tr;
  return balance.leave_type_name;
}

/**
 * Returns the localized label for a leave request status.
 * Uses langPackLabel from LanguageContext for translation.
 */
export function localizedStatus(
  status: string,
  langPackLabel: (key: string) => string | undefined
): string {
  const map: Record<string, string> = {
    pending: langPackLabel('txtPending') || 'Pending',
    approved: langPackLabel('txtApproved') || 'Approved',
    rejected: langPackLabel('txtRejected') || 'Rejected',
    cancelled: langPackLabel('txtCancelled') || 'Cancelled',
  };
  return map[status] || status;
}

/**
 * Formats a date string or Date object using the appropriate locale.
 * Turkish: dd.MM.yyyy (30.03.2026), English: MM/dd/yyyy (3/30/2026)
 */
export function formatLocalDate(
  dateInput: string | Date | null | undefined,
  language: string
): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US');
}
