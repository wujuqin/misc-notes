export const iterations = 600000;
const encode = bytes => btoa(String.fromCharCode(...bytes));
function decode(value) {
  if (typeof value !== 'string' || value.length > 16000000) throw new Error('无效的密文格式');
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
async function key(password, salt, usage) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', hash:'SHA-256', salt, iterations}, base, {name:'AES-GCM', length:256}, false, [usage]);
}
const aad = new TextEncoder().encode('misc-notes:v1');
export async function encrypt(text, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv, additionalData:aad, tagLength:128}, await key(password,salt,'encrypt'), new TextEncoder().encode(text)));
  // Encode in chunks to avoid exceeding JavaScript's argument limit.
  let binary = '';
  for (let i=0;i<ciphertext.length;i+=8192) binary += String.fromCharCode(...ciphertext.subarray(i,i+8192));
  return {version:1, kdf:'PBKDF2-SHA256', iterations, cipher:'AES-256-GCM', salt:encode(salt), iv:encode(iv), ciphertext:btoa(binary)};
}
export async function decrypt(payload, password) {
  if (payload?.version !== 1 || payload.kdf !== 'PBKDF2-SHA256' || payload.iterations !== iterations || payload.cipher !== 'AES-256-GCM') throw new Error('不支持的加密格式');
  const salt = decode(payload.salt), iv = decode(payload.iv), ciphertext = decode(payload.ciphertext);
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) throw new Error('无效的密文格式');
  const result = await crypto.subtle.decrypt({name:'AES-GCM', iv, additionalData:aad, tagLength:128}, await key(password,salt,'decrypt'), ciphertext);
  return new TextDecoder('utf-8', {fatal:true}).decode(result);
}
