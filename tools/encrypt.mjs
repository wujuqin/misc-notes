import {readFile,writeFile} from 'node:fs/promises';
import {basename,extname} from 'node:path';
import {encrypt} from '../docs/crypto.mjs';
import {packNote} from '../docs/note.mjs';
const [source,destination,...extraImages] = process.argv.slice(2);
const password = process.env.MISC_NOTES_PASSWORD;
if (!source || !destination || !password) throw new Error('需要输入文件、输出文件和本地密码。');
const types = {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
const sourceIsImage = Boolean(types[extname(source).toLowerCase()]);
const paths = sourceIsImage ? [source,...extraImages] : extraImages;
if (paths.length > 10) throw new Error('最多支持 10 张图片。');
let total = 0;
const images = [];
for (const path of paths) {
  const mime = types[extname(path).toLowerCase()];
  if (!mime) throw new Error('支持 PNG、JPEG、WebP 和 GIF 图片。');
  const bytes = await readFile(path);
  total += bytes.length;
  if (total > 5000000) throw new Error('图片总大小不能超过 5 MB。');
  const valid = mime === 'image/png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : mime === 'image/jpeg' ? bytes[0]===255 && bytes[1]===216 && bytes[2]===255
    : mime === 'image/webp' ? bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP'
    : ['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6));
  if (!valid) throw new Error('图片内容与文件格式不一致。');
  images.push({name:basename(path),mime,base64:bytes.toString('base64')});
}
const text = sourceIsImage ? '' : await readFile(source,'utf8');
const content = images.length ? packNote(text,images) : text;
if (Buffer.byteLength(content,'utf8') > 8000000) throw new Error('笔记总大小不能超过 8 MB。');
const payload = await encrypt(content,password);
await writeFile(destination,JSON.stringify(payload,null,2)+'\n','utf8');
console.log('已生成密文。');
