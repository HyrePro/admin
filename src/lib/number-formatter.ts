/**
 * Format numbers with locale-specific formatting
 * @param num - The number to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param options - Additional formatting options
 * @returns Formatted number string
 */
export function formatNumber(
  num: number | string | null | undefined,
  locale: string = 'en-US',
  options: Intl.NumberFormatOptions = {}
): string {
  if (num === null || num === undefined || num === '') {
    return 'N/A';
  }

  const numberValue = typeof num === 'string' ? parseFloat(num) : num;

  if (isNaN(numberValue)) {
    return 'N/A';
  }

  // Default options for number formatting
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  };

  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(numberValue);
  } catch (error) {
    // Fallback to basic formatting if locale is invalid
    console.warn(`Invalid locale: ${locale}`, error);
    return new Intl.NumberFormat('en-US', defaultOptions).format(numberValue);
  }
}

/**
 * Format large numbers with abbreviations (e.g., 1000 -> 1K, 1000000 -> 1M)
 * @param num - The number to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Formatted number string with abbreviation
 */
export function formatNumberAbbreviated(
  num: number | string | null | undefined,
  locale: string = 'en-US'
): string {
  if (num === null || num === undefined || num === '') {
    return 'N/A';
  }

  const numberValue = typeof num === 'string' ? parseFloat(num) : num;

  if (isNaN(numberValue)) {
    return 'N/A';
  }

  // Define thresholds and abbreviations
  const thresholds = [
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' }
  ];

  // Find the appropriate threshold
  for (const { value, symbol } of thresholds) {
    if (Math.abs(numberValue) >= value) {
      const formattedValue = numberValue / value;
      // Format with 1 decimal place if the result is less than 10, otherwise no decimals
      const decimals = formattedValue < 10 ? 1 : 0;
      return `${formatNumber(formattedValue, locale, { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      })}${symbol}`;
    }
  }

  // If number is less than 1000, format normally
  return formatNumber(numberValue, locale);
}