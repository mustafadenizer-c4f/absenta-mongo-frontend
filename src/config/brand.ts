/**
 * Brand configuration — single source of truth for all brand-related strings.
 *
 * Change the values here to rebrand the entire application.
 */
export const BRAND = {
  /** App name shown in the header, sidebar, page titles, etc. */
  name: 'Absenta',

  /** Company / copyright holder name */
  company: 'Cloud4Feed',

  /** Short tagline used in meta description and subtitles */
  tagline: 'Employee Leave Management',

  /** Logo alt text (defaults to name if not set) */
  get logoAlt(): string {
    return this.name;
  },

  /** Copyright line shown in auth pages */
  get copyright(): string {
    return `© ${new Date().getFullYear()} ${this.company} ${this.name}`;
  },
} as const;
