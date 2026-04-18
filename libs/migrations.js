/**
 * Data model migrations for Carbonlite (AC-P9-014)
 *
 * Provides forward-only migration for stored data schemas.
 * For v1, this is a no-op passthrough. The pattern is established
 * for future schema changes.
 */

const CURRENT_VERSION = 1;

/**
 * Migrate data from one version to another.
 * @param {object} data - The data object to migrate
 * @param {number} fromVersion - Source version (0 = no version field)
 * @param {number} toVersion - Target version
 * @returns {object} Migrated data with _version set
 */
function migrate(data, fromVersion, toVersion) {
  const result = { ...data };

  // v0 → v1: Add _version field (no schema changes in v1)
  if (fromVersion < 1 && toVersion >= 1) {
    result._version = 1;
  }

  // Future migrations would go here:
  // if (fromVersion < 2 && toVersion >= 2) { /* v1 → v2 changes */ }

  return result;
}

if (typeof globalThis !== "undefined") {
  globalThis.migrate = migrate;
  globalThis.DATA_VERSION = CURRENT_VERSION;
}

export { migrate, CURRENT_VERSION };
