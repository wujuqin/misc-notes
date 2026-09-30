import {decrypt} from './crypto.mjs';
import {loadLatest, LoadError} from './source.mjs';
const $ = id => document.getElementById(id);
const clear = () => { $('password').value=''; $('content').textContent=''; $('result').hidden=true; };
$('unlock').addEventListener('submit', async event => {
  event.preventDefault();
  const password = $('password').value;
  clear();
  $('decrypt').disabled=true;
  $('status').textContent='正在打开笔记…';
  try {
    if (!crypto.subtle) throw new LoadError('请使用 HTTPS 打开页面。');
    const payload = await loadLatest();
    $('status').textContent='正在整理页面…';
    const text = await decrypt(payload, password);
    $('content').textContent=text;
    $('result').hidden=false;
    $('status').textContent='笔记已打开。';
  } catch (error) { $('status').textContent=error instanceof LoadError ? error.message : '未能打开笔记，请检查口令或笔记文件。'; }
  finally { $('decrypt').disabled=false; }
});
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('content').textContent); $('status').textContent='已复制全文。'; }
  catch { $('status').textContent='浏览器未允许自动复制，请选中正文后手动复制。'; }
});
$('clear').addEventListener('click', () => {clear(); $('status').textContent='笔记已收起。'; $('password').focus();});
window.addEventListener('pagehide',clear);
