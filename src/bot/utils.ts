/**
 * Whitelisted characters:
 * alphanumeric characters, /, ', (), whitespace
 */
export function sanitiseInputText(text: string): string {
  const filterRegex = /[^a-zA-Z/'()\s]/g;
  return text.replace(filterRegex, '');
}
