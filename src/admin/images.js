// Image validation, resizing and Supabase Storage helpers.
import { supabase, BUCKET } from './supabase.js';

export const MAX_BYTES = 5 * 1024 * 1024;              // matches the bucket limit set in SQL
export const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPT = ALLOWED.join(',');

// Look at the first bytes of the file: the real format must match (a renamed .exe is rejected).
async function sniff(file) {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

// Returns an error message, or null when the file is acceptable.
export async function validateImage(file) {
  if (!file) return 'No file selected.';
  if (!ALLOWED.includes(file.type)) return `"${file.name}" is not a JPG, PNG or WebP image.`;
  if (file.size > MAX_BYTES) return `"${file.name}" is larger than 5 MB (${(file.size / 1048576).toFixed(1)} MB). Please choose a smaller photo.`;
  if (file.size === 0) return `"${file.name}" is empty.`;
  const real = await sniff(file);
  if (!real) return `"${file.name}" does not look like a real image file.`;
  return null;
}

async function decode(file) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) { /* fall through */ }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image.')); };
    img.src = url;
  });
}

// Shrinks big photos (max side 1600px) and re-encodes to WebP so pages load fast on mobile data.
// Falls back to the original file whenever resizing is not possible or would not help.
export async function prepareImage(file, { maxSide = 1600, keepTransparency = false } = {}) {
  try {
    const bmp = await decode(file);
    const w = bmp.width, h = bmp.height;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const needsWork = scale < 1 || file.size > 700 * 1024;
    if (!needsWork) return { blob: file, type: file.type };
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    if (bmp.close) bmp.close();
    const type = keepTransparency && file.type === 'image/png' ? 'image/png' : 'image/webp';
    const blob = await new Promise((res) => canvas.toBlob(res, type, 0.86));
    if (blob && blob.type === type && blob.size < file.size) return { blob, type };
  } catch (_) { /* use original */ }
  return { blob: file, type: file.type };
}

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Validate -> resize -> upload. Returns { url, path }.
export async function uploadImage(file, folder, opts) {
  const problem = await validateImage(file);
  if (problem) throw new Error(problem);
  const { blob, type } = await prepareImage(file, opts);
  const rand = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)).slice(0, 12);
  const path = `${folder}/${Date.now()}-${rand}.${EXT[type]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// Path inside our bucket for a public URL (null for external URLs such as the seeded demo photos).
export function pathFromUrl(url) {
  const m = String(url || '').match(/\/storage\/v1\/object\/public\/store-media\/(.+?)(?:\?.*)?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function removeFiles(paths) {
  const list = [...new Set((paths || []).filter(Boolean))];
  if (!list.length) return;
  try { await supabase.storage.from(BUCKET).remove(list); } catch (_) { /* best effort: an orphan file is harmless */ }
}

// Delete files only if no product image row still points at them (duplicated products share files).
export async function removeUnusedProductFiles(paths) {
  const list = [...new Set((paths || []).filter(Boolean))];
  if (!list.length) return;
  try {
    const { data } = await supabase.from('product_images').select('storage_path').in('storage_path', list);
    const used = new Set((data || []).map((r) => r.storage_path));
    await removeFiles(list.filter((p) => !used.has(p)));
  } catch (_) { /* best effort */ }
}
