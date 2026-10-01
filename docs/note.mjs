const prefix = 'NOTES/1\n';
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export function packNote(text, images) {
  return prefix + JSON.stringify({text, images});
}

export function unpackNote(value) {
  if (!value.startsWith(prefix)) return {text: value, images: []};
  const note = JSON.parse(value.slice(prefix.length));
  if (typeof note.text !== 'string' || !Array.isArray(note.images) || note.images.length > 10) throw new Error('无效的笔记');
  let totalBytes = 0;
  const images = note.images.map(image => {
    if (!image || typeof image.name !== 'string' || image.name.length > 255 || !imageTypes.has(image.mime) || typeof image.base64 !== 'string' || image.base64.length > 7000000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(image.base64)) throw new Error('无效的图片');
    const bytes = Uint8Array.from(atob(image.base64), c => c.charCodeAt(0));
    totalBytes += bytes.length;
    if (!bytes.length || totalBytes > 5000000) throw new Error('图片过大');
    return {name: image.name, mime: image.mime, bytes};
  });
  return {text: note.text, images};
}
