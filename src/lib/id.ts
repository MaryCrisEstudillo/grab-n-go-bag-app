let counter = 0;

/** Unique within a session — enough for local-only data. */
export function createId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}
