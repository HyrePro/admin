/**
 * Date and Time Formatting Utility
 * Provides locale-aware formatting for dates and times
 */

export interface DateFormatOptions {
  locale?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  year?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  hour12?: boolean;
  timeZone?: string;
}

/**
 * Format a date string to a locale-specific format
 * @param date - Date string or Date object to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | null | undefined, options?: DateFormatOptions): string {
  if (!date) {
    return '';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Default options for date formatting
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    // Merge provided options with defaults
    const formatOptions: Intl.DateTimeFormatOptions = {
      ...defaultOptions,
      ...(options?.dateStyle && { dateStyle: options.dateStyle }),
      ...(options?.timeStyle && { timeStyle: options.timeStyle }),
      ...(options?.month && { month: options.month }),
      ...(options?.day && { day: options.day }),
      ...(options?.year && { year: options.year }),
      ...(options?.hour && { hour: options.hour }),
      ...(options?.minute && { minute: options.minute }),
      ...(options?.second && { second: options.second }),
      ...(options?.hour12 !== undefined && { hour12: options.hour12 }),
      ...(options?.timeZone && { timeZone: options.timeZone }),
    };

    return new Intl.DateTimeFormat(options?.locale || 'en-US', formatOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    // Fallback to simple date string if formatting fails
    return date.toString();
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "yesterday")
 * @param date - Date string or Date object to format
 * @param locale - Locale for the relative time format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: string | Date | null | undefined, locale?: string): string {
  if (!date) {
    return '';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    // Define thresholds in seconds
    const rtf = new Intl.RelativeTimeFormat(locale || 'en-US', { numeric: 'auto' });
    
    const units: Array<{ unit: Intl.RelativeTimeFormatUnit, value: number }> = [
      { unit: 'year', value: 31536000 },
      { unit: 'month', value: 2592000 },
      { unit: 'day', value: 86400 },
      { unit: 'hour', value: 3600 },
      { unit: 'minute', value: 60 },
      { unit: 'second', value: 1 },
    ];

    for (const { unit, value } of units) {
      const divisor = Math.floor(Math.abs(diffInSeconds) / value);
      if (divisor >= 1) {
        return rtf.format(-divisor, unit);
      }
    }

    return rtf.format(0, 'second');
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return date.toString();
  }
}

/**
 * Format a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @param options - Formatting options
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  options?: DateFormatOptions
): string {
  if (!startDate && !endDate) {
    return '';
  }
  if (!startDate) {
    return `Until ${formatDate(endDate, options)}`;
  }
  if (!endDate) {
    return `Since ${formatDate(startDate, options)}`;
  }

  const start = formatDate(startDate, options);
  const end = formatDate(endDate, options);
  return `${start} - ${end}`;
}

/**
 * Get common date format presets
 */
export const DatePresets = {
  // Common date formats
  DATE_SHORT: { dateStyle: 'short' } as DateFormatOptions,
  DATE_MEDIUM: { dateStyle: 'medium' } as DateFormatOptions,
  DATE_LONG: { dateStyle: 'long' } as DateFormatOptions,
  DATE_FULL: { dateStyle: 'full' } as DateFormatOptions,
  
  // Date with time
  DATETIME_SHORT: { dateStyle: 'short', timeStyle: 'short' } as DateFormatOptions,
  DATETIME_MEDIUM: { dateStyle: 'medium', timeStyle: 'medium' } as DateFormatOptions,
  DATETIME_LONG: { dateStyle: 'long', timeStyle: 'long' } as DateFormatOptions,
  
  // Custom formats
  CUSTOM_MDY: { month: 'short', day: 'numeric', year: 'numeric' } as DateFormatOptions,
  CUSTOM_MD: { month: 'short', day: 'numeric' } as DateFormatOptions,
  CUSTOM_YMD: { year: 'numeric', month: 'short', day: 'numeric' } as DateFormatOptions,
  CUSTOM_HMS: { hour: 'numeric', minute: '2-digit', second: '2-digit' } as DateFormatOptions,
};

/**
 * Get supported locales for date formatting
 */
export function getSupportedLocales(): string[] {
  return [
    'en-US', 'en-GB', 'en-CA', 'en-AU',
    'es-ES', 'es-MX', 'es-AR',
    'fr-FR', 'fr-CA', 'fr-BE',
    'de-DE', 'de-AT', 'de-CH',
    'it-IT', 'it-CH',
    'pt-BR', 'pt-PT',
    'ja-JP', 'zh-CN', 'zh-TW',
    'ko-KR', 'ru-RU', 'ar-SA',
    'hi-IN', 'th-TH', 'vi-VN'
  ];
}

/**
 * Validate if a locale is supported for date formatting
 */
export function isLocaleSupported(locale: string): boolean {
  try {
    new Intl.DateTimeFormat(locale);
    return true;
  } catch (e) {
    return false;
  }
}