const fallbackFurnitureImages = [
  'https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

export const getFallbackImage = (index = 0) => {
  const i = Number.isFinite(index) ? index : 0;
  return fallbackFurnitureImages[Math.abs(i) % fallbackFurnitureImages.length];
};

export const normalizeImageUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^(data:|blob:)/i.test(raw)) return raw;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      const isLocalhost = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
      if (isLocalhost && typeof window !== 'undefined') {
        return `${window.location.origin}${u.pathname}${u.search}`;
      }
      return raw;
    } catch {
      return raw;
    }
  }

  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return path;
};

export const normalizeProductImages = (images) => {
  const arr = Array.isArray(images) ? images : [];
  const normalized = arr.map(normalizeImageUrl).filter(Boolean);
  return normalized.length ? normalized : [getFallbackImage(0)];
};

export const isVideoUrl = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return false;
  return /(\.mp4|\.mov|\.webm|\.m4v)(\?|#|$)/.test(raw) || raw.includes('/video/upload/');
};

export const applyImageFallback = (event, index = 0) => {
  const el = event?.currentTarget;
  if (!el || el.dataset.fallbackApplied === '1') return;
  el.dataset.fallbackApplied = '1';
  el.src = getFallbackImage(index);
};
