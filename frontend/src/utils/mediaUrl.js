const resolveMediaUrl = (value, baseUrl = '') => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^(https?:|file:|content:|data:|blob:)/i.test(trimmed)) return trimmed;
  const base = String(baseUrl || '').replace(/\/+$/, '');
  if (!base) return trimmed;
  return `${base}/${trimmed.replace(/^\/+/, '')}`;
};

module.exports = { resolveMediaUrl };

