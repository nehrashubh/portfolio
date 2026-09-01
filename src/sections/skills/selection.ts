export function toggleSelect(current: string | null, name: string): string | null {
  return current === name ? null : name
}
