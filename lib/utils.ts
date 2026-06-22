// Minimal classnames helper (shadcn convention) without pulling extra deps in
// the Phase-1 slice. Filters falsy values and joins with a space.
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
