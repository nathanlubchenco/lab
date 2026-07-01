// Switchable gameplay variants: keys 1..N select, choice persists per game,
// `?v=<id>` overrides for sharing links.
export function createVariants(gameId, list) {
  const key = 'variant:' + gameId;
  let idx = 0;
  const fromUrl = new URLSearchParams(location.search).get('v');
  const saved = fromUrl || localStorage.getItem(key);
  if (saved) {
    const i = list.findIndex(v => v.id === saved);
    if (i >= 0) idx = i;
  }

  return {
    get current() { return list[idx]; },
    get list() { return list; },
    is(id) { return list[idx].id === id; },
    // Returns true when the selection changed this frame (caller should reset the round).
    update(input) {
      for (let i = 0; i < list.length; i++) {
        if (input.wasPressed('Digit' + (i + 1)) && i !== idx) {
          idx = i;
          try { localStorage.setItem(key, list[idx].id); } catch { /* private mode */ }
          return true;
        }
      }
      return false;
    },
  };
}

export function drawVariantHUD(r, ctx, W, H, variants, color) {
  const v = variants.current;
  const label = variants.list.map((it, i) => (it === v ? `[${i + 1} ${it.name}]` : ` ${i + 1} ${it.name} `)).join(' ');
  r.text(label, W - 22, 48, color, '10px monospace', { align: 'right' });
  ctx.globalAlpha = 0.7;
  r.text(v.blurb, W - 22, 62, color, '9px monospace', { align: 'right' });
  ctx.globalAlpha = 1;
}
