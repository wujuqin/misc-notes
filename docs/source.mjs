import {headerTimeoutMs,bodyTimeoutMs} from './limits.mjs?v=8';
export class LoadError extends Error {}

async function readPayload(url, api = false) {
  const controller = new AbortController();
  let timeout = setTimeout(() => controller.abort(), headerTimeoutMs);
  try {
    url.searchParams.set('t', String(Date.now()));
    const response = await fetch(url, {
      headers: {Accept: api ? 'application/vnd.github.raw+json' : 'application/json'},
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    timeout = setTimeout(() => controller.abort(), bodyTimeoutMs);
    if (!response.ok) {
      if (response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0')) {
        throw new LoadError('读取次数暂时达到限制，请稍后再试。');
      }
      if (response.status === 404) throw new LoadError('尚未找到笔记，请确认已上传。');
      throw new LoadError('暂时无法读取笔记，请稍后重试。');
    }
    const payload = await response.json();
    if (!payload || payload.version !== 1 || typeof payload.salt !== 'string' || typeof payload.iv !== 'string' || typeof payload.ciphertext !== 'string') throw new LoadError('笔记文件格式不正确，请稍后重试。');
    return payload;
  } catch (error) {
    if (error instanceof LoadError) throw error;
    if (controller.signal.aborted) throw new LoadError('读取超时，请检查网络后重试。');
    throw new LoadError('读取失败，请检查网络后重试。');
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadLatest({onFallback} = {}) {
  const apiUrl = new URL('https://api.github.com/repos/wujuqin/misc-notes/contents/docs/payload.json');
  apiUrl.searchParams.set('ref', 'main');
  try {
    return await readPayload(apiUrl, true);
  } catch (apiError) {
    let payload;
    try {
      // Pages can lag the latest commit; retain the API as the preferred source.
      payload = await readPayload(new URL('./payload.json', import.meta.url));
    } catch (backupError) {
      if (apiError.message.includes('超时') || backupError.message.includes('超时')) throw new LoadError('读取超时，请检查网络后重试。');
      throw new LoadError('读取失败，请检查网络或稍后重试。');
    }
    onFallback?.();
    return payload;
  }
}
