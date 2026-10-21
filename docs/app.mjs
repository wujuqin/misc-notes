import {decrypt} from './crypto.mjs?v=8';
import {loadLatest, LoadError} from './source.mjs?v=8';
import {unpackNote} from './note.mjs?v=8';
const $ = id => document.getElementById(id);
const urls = [];
const clear = () => {
  $('password').value=''; $('content').textContent=''; $('images').replaceChildren(); $('files').replaceChildren(); $('result').hidden=true;
  for (const url of urls) URL.revokeObjectURL(url);
  urls.length=0;
};
function safeName(name, fallback = 'image.png') {
  let safe = name.replace(/[\\/:*?"<>|\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '_').trim().replace(/[. ]+$/g, '');
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(safe)) safe='_'+safe;
  return safe || fallback;
}
function showFiles(files) {
  for (const file of files) {
    const blob = new Blob([file.bytes], {type:'application/octet-stream'});
    const url = URL.createObjectURL(blob); urls.push(url);
    const card=document.createElement('div'); card.className='file-card';
    const details=document.createElement('div'); details.className='file-details';
    const name=document.createElement('span'); name.className='file-name'; name.textContent=safeName(file.name,'file.bin');
    const size=document.createElement('span'); size.className='file-size';
    size.textContent=file.bytes.length < 1024 ? file.bytes.length+' B' : file.bytes.length < 1048576 ? (file.bytes.length/1024).toFixed(1)+' KB' : (file.bytes.length/1048576).toFixed(1)+' MB';
    const download=document.createElement('a'); download.href=url; download.download=safeName(file.name,'file.bin'); download.className='secondary download'; download.textContent='下载';
    details.append(name,size); card.append(details,download); $('files').append(card);
  }
}
async function pngBlob(img, blob) {
  if (blob.type === 'image/png') return blob;
  await img.decode();
  const width = img.naturalWidth, height = img.naturalHeight;
  if (!width || !height || width * height > 24000000) throw new Error('图片过大');
  const canvas = document.createElement('canvas');
  canvas.width=width; canvas.height=height;
  canvas.getContext('2d').drawImage(img,0,0);
  return new Promise((resolve,reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('转换失败')), 'image/png'));
}
function showImages(images) {
  for (const image of images) {
    const blob = new Blob([image.bytes], {type:image.mime});
    const url = URL.createObjectURL(blob); urls.push(url);
    const card=document.createElement('figure'); card.className='image-card';
    const img=document.createElement('img'); img.src=url; img.alt=safeName(image.name);
    img.addEventListener('error', () => { $('status').textContent='图片未能显示，可以尝试下载原图。'; });
    const actions=document.createElement('figcaption'); actions.className='image-actions';
    const name=document.createElement('span'); name.className='image-name'; name.textContent=safeName(image.name);
    const buttons=document.createElement('div');
    const copy=document.createElement('button'); copy.type='button'; copy.className='secondary'; copy.textContent='复制图片';
    copy.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('不支持图片复制');
        const pending = pngBlob(img,blob);
        // Pass a promise immediately so browsers retain the user's click activation.
        const item = new ClipboardItem({'image/png':pending});
        copy.disabled=true;
        await navigator.clipboard.write([item]);
        $('status').textContent='已复制图片，可以粘贴到支持图片的应用。';
      } catch { $('status').textContent='未能复制图片，请下载原图后使用。'; }
      finally { copy.disabled=false; }
    });
    const download=document.createElement('a'); download.href=url; download.download=safeName(image.name); download.className='secondary download'; download.textContent='下载原图';
    buttons.append(copy,download); actions.append(name,buttons); card.append(img,actions); $('images').append(card);
  }
}
$('unlock').addEventListener('submit', async event => {
  event.preventDefault();
  const password = $('password').value;
  clear();
  $('decrypt').disabled=true;
  $('status').textContent='正在打开笔记…';
  let backup=false;
  try {
    if (!crypto.subtle) throw new LoadError('请使用 HTTPS 打开页面。');
    const payload = await loadLatest({onFallback:()=>{backup=true;}});
    $('status').textContent='正在整理页面…';
    const note = unpackNote(await decrypt(payload, password));
    $('content').textContent=note.text;
    $('content').hidden=!note.text;
    $('copy').hidden=!note.text;
    showImages(note.images);
    showFiles(note.files);
    $('result-label').textContent=note.text ? '正文' : note.files.length ? '附件' : '图片';
    $('result').hidden=false;
    $('status').textContent=backup ? '笔记已打开（备用读取，内容可能稍有延迟）。' : '笔记已打开。';
  } catch (error) { $('status').textContent=error instanceof LoadError ? error.message : backup ? '备用笔记未能打开，请检查口令；若刚更新内容，请稍后重试。' : '未能打开笔记，请检查口令或笔记文件。'; }
  finally { $('decrypt').disabled=false; }
});
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('content').textContent); $('status').textContent='已复制全文。'; }
  catch { $('status').textContent='浏览器未允许自动复制，请选中正文后手动复制。'; }
});
$('clear').addEventListener('click', () => {clear(); $('status').textContent='笔记已收起。'; $('password').focus();});
window.addEventListener('pagehide',clear);
