/**
 * Whitelisted characters:
 * alphanumeric characters, numbers, /, ', (), whitespace
 */
export function sanitiseInputText(text: string): string {
  const filterRegex = /[^a-zA-Z0-9/'()\s]/g;
  return text.replace(filterRegex, '');
}
