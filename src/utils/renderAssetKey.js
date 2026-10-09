/** Cache index, not a security digest. Entries also compare their entire source,
 * so a hash collision can only cause a cache miss, never display wrong content. */
export function renderAssetKey(source) {
  let h = 2166136261;
  for (let i = 0; i < source.length; i++) h = Math.imul(h ^ source.charCodeAt(i), 16777619);
  return `${source.length.toString(36)}-${(h >>> 0).toString(36)}`;
}
