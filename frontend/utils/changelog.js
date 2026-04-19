const STORAGE_KEY = 'changelog_lastViewedVersion';
const DEFAULT_VERSION = 'v0.0.0';

/**
 * Returns true if the user has not yet seen the latest changelog entry.
 * The changelog array must be sorted newest-first; index 0 is the latest entry.
 * Comparison is string equality — no semver parsing needed.
 *
 * @param {Array} changelog
 * @param {string} lastViewedVersion
 * @returns {boolean}
 */
export function hasUnread(changelog, lastViewedVersion) {
  if (!Array.isArray(changelog) || changelog.length === 0) return false;
  return changelog[0].version !== lastViewedVersion;
}

/**
 * Reads the stored last-viewed version from device storage.
 * Returns DEFAULT_VERSION if nothing is stored or storage is unavailable.
 *
 * @returns {string}
 */
export function readLastViewedVersion() {
  try {
    return uni.getStorageSync(STORAGE_KEY) || DEFAULT_VERSION;
  } catch {
    return DEFAULT_VERSION;
  }
}

/**
 * Persists the given version as the last-viewed version.
 * Silently swallows storage errors.
 *
 * @param {string} version
 */
export function writeLastViewedVersion(version) {
  try {
    uni.setStorageSync(STORAGE_KEY, version);
  } catch {
    // storage unavailable — ignore
  }
}
