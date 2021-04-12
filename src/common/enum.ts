/**
 * Parses a given string to a value of the given enum, if it is a valid enum value.
 */
export function parseToEnum<T>(
  enumType: T,
  value: string,
): T[keyof T] | undefined {
  return Object.values(enumType).find((c) => c === value);
}
