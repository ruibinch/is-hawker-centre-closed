/**
 * Whitelisted characters:
 * alphanumeric characters, numbers, /, ', (), whitespace, underscore
 */
export function sanitiseInputText(text: string): string {
  const filterRegex = /[^a-zA-Z0-9/'()\s_]/g;
  return text.replace(filterRegex, '').trim();
}
