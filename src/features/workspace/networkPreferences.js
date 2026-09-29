/** Versioned, optional display preferences. Never store graph data or route state. */
export const SETTINGS_KEY = 'nextchina-graph-settings:v2';
export const DEFAULT_NETWORK_SETTINGS = Object.freeze({
  structure: true, relations: true, prerequisites: true, references: true,
  colored: false, labels: 1, nodeSize: 1, lineWidth: 1, lineOpacity: .55,
  onlyResources: false, groups: null, detail: 'all', focusNeighbors: false, wheelMode: 'zoom'
});
export function normalizeNetworkSettings(input, groupIds = []) {
  const value = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const result = { ...DEFAULT_NETWORK_SETTINGS };
  for (const key of ['structure','relations','prerequisites','references','colored','onlyResources','focusNeighbors']) {
    if (typeof value[key] === 'boolean') result[key] = value[key];
  }
  for (const [key, min, max] of [['labels',0,2],['nodeSize',.7,1.8],['lineWidth',.5,2],['lineOpacity',.15,.9]]) {
    if (Number.isFinite(value[key])) result[key] = Math.max(min, Math.min(max, value[key]));
  }
  if (['all','overview','concepts'].includes(value.detail)) result.detail = value.detail;
  if (['zoom','pan'].includes(value.wheelMode)) result.wheelMode = value.wheelMode;
  if (Array.isArray(value.groups)) {
    const ids = [...new Set(value.groups.filter(id => typeof id === 'string' && groupIds.includes(id)))];
    // An intentionally empty selection remains empty; obsolete saved IDs reset safely.
    result.groups = value.groups.length > 0 && ids.length === 0 ? null : ids.length === groupIds.length ? null : ids;
  }
  return result;
}
export function readNetworkSettings(groupIds) {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return normalizeNetworkSettings(raw && raw.length <= 4096 ? JSON.parse(raw) : null, groupIds);
  } catch { return normalizeNetworkSettings(null, groupIds); }
}
export function writeNetworkSettings(settings, groupIds) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeNetworkSettings(settings, groupIds))); } catch { /* Storage is optional. */ }
}
