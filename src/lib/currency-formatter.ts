/**
 * Format currency with locale-specific formatting
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'N/A';
  }

  const numberValue = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numberValue)) {
    return 'N/A';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberValue);
  } catch (error) {
    // Fallback to basic formatting if locale or currency is invalid
    console.warn(`Invalid locale or currency: ${locale}, ${currency}`, error);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberValue);
  }
}

/**
 * Format salary ranges with proper currency formatting
 * @param minSalary - The minimum salary in the range
 * @param maxSalary - The maximum salary in the range
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Formatted salary range string
 */
export function formatSalaryRange(
  minSalary: number | string | null | undefined,
  maxSalary: number | string | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (minSalary === null || minSalary === undefined || minSalary === '') {
    if (maxSalary === null || maxSalary === undefined || maxSalary === '') {
      return 'Not specified';
    }
    return `Up to ${formatCurrency(maxSalary, currency, locale)}`;
  }

  if (maxSalary === null || maxSalary === undefined || maxSalary === '') {
    return `At least ${formatCurrency(minSalary, currency, locale)}`;
  }

  const minNumber = typeof minSalary === 'string' ? parseFloat(minSalary) : minSalary;
  const maxNumber = typeof maxSalary === 'string' ? parseFloat(maxSalary) : maxSalary;

  if (isNaN(minNumber) && isNaN(maxNumber)) {
    return 'Not specified';
  }

  if (isNaN(minNumber)) {
    return `Up to ${formatCurrency(maxNumber, currency, locale)}`;
  }

  if (isNaN(maxNumber)) {
    return `At least ${formatCurrency(minNumber, currency, locale)}`;
  }

  return `${formatCurrency(minNumber, currency, locale)} - ${formatCurrency(maxNumber, currency, locale)}`;
}