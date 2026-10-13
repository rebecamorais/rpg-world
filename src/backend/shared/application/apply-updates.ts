/**
 * Updates fields of a target object based on a source object,
 * ignoring undefined values.
 */
export function applyUpdates<T extends object>(target: T, updates: Partial<T>): void {
  (Object.keys(updates) as Array<keyof T>).forEach((key) => {
    const value = updates[key];
    if (value !== undefined) {
      target[key] = value as T[keyof T];
    }
  });
}
