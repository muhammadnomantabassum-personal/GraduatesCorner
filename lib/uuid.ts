const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function toNullableUuid(value: string | null | undefined) {
  return value && uuidPattern.test(value) ? value : null
}
