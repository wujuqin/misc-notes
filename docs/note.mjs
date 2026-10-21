import {maxBinaryBytes,maxItems,maxAttachmentBase64Chars} from './limits.mjs?v=8';
export {maxBinaryBytes,maxItems};
const prefix = 'NOTES/1\n';
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export function packNote(text, images = [], files = []) {
  return prefix + JSON.stringify({text, images, files});
}

export function unpackNote(value) {
  if (!value.startsWith(prefix)) return {text: value, images: [], files: []};
  const note = JSON.parse(value.slice(prefix.length));
  const fileEntries = note.files === undefined ? [] : note.files;
  if (typeof note.text !== 'string' || !Array.isArray(note.images) || note.images.length > maxItems || !Array.isArray(fileEntries) || fileEntries.length > maxItems) throw new Error('无效的笔记');
  let totalBytes = 0;
  function decodeEntry(entry, isImage) {
    if (!entry || typeof entry.name !== 'string' || !entry.name.length || entry.name.length > 255 || typeof entry.base64 !== 'string' || entry.base64.length > maxAttachmentBase64Chars || entry.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(entry.base64)) throw new Error('无效的附件');
    if (isImage && !imageTypes.has(entry.mime)) throw new Error('无效的图片');
    const padding = entry.base64.endsWith('==') ? 2 : entry.base64.endsWith('=') ? 1 : 0;
    totalBytes += entry.base64.length / 4 * 3 - padding;
    if (totalBytes > maxBinaryBytes) throw new Error(`附件总大小不能超过 ${maxBinaryBytes / 1000000} MB。`);
    const binary = atob(entry.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    if (isImage && !bytes.length) throw new Error('无效的图片');
    return isImage ? {name:entry.name, mime:entry.mime, bytes} : {name:entry.name, bytes};
  }
  const images = note.images.map(image => decodeEntry(image, true));
  const files = fileEntries.map(file => decodeEntry(file, false));
  return {text: note.text, images, files};
}
