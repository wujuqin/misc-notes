export const maxBinaryBytes = 20000000;
export const maxNoteBytes = 32000000;
export const maxItems = 10;
export const maxAttachmentBase64Chars = 4 * Math.ceil(maxBinaryBytes / 3);
export const maxCiphertextChars = 4 * Math.ceil((maxNoteBytes + 16) / 3);
export const headerTimeoutMs = 15000;
export const bodyTimeoutMs = 90000;
