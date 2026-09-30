import {decrypt} from './crypto.mjs';
const $ = id => document.getElementById(id);
const clear = () => { $('password').value=''; $('content').textContent=''; $('result').hidden=true; };
async function load() {
  const response = await fetch(`./payload.json?t=${Date.now()}`, {cache:'no-store',credentials:'omit'});
  if (!response.ok) throw new Error('无法获取密文');
  return response.json();
}
load().then(() => { $('status').textContent='密文已就绪，请输入密码。'; }).catch(() => { $('status').textContent='密文尚未就绪，请稍后刷新。'; });
$('unlock').addEventListener('submit', async event => {
  event.preventDefault();
  const password = $('password').value;
  clear();
  $('decrypt').disabled=true;
  $('status').textContent='正在解密…';
  try {
    if (!crypto.subtle) throw new Error('需要 HTTPS');
    const text = await decrypt(await load(), password);
    $('content').textContent=text;
    $('result').hidden=false;
    $('status').textContent='解密成功。';
  } catch { $('status').textContent='解密失败：密码不正确、密文损坏，或页面尚未更新。请确认使用 HTTPS。'; }
  finally { $('decrypt').disabled=false; }
});
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('content').textContent); $('status').textContent='已复制全文。'; }
  catch { $('status').textContent='浏览器未允许自动复制，请选中正文后手动复制。'; }
});
$('clear').addEventListener('click', () => {clear(); $('status').textContent='正文已清空。'; $('password').focus();});
window.addEventListener('pagehide',clear);
