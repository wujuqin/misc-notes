export class LoadError extends Error {}

export async function loadLatest() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const url = new URL('https://api.github.com/repos/wujuqin/misc-notes/contents/docs/payload.json');
    url.searchParams.set('ref', 'main');
    url.searchParams.set('t', String(Date.now()));
    const response = await fetch(url, {
      headers: {Accept: 'application/vnd.github.raw+json'},
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0')) {
        throw new LoadError('读取次数暂时达到限制，请稍后再试。');
      }
      if (response.status === 404) throw new LoadError('尚未找到笔记，请确认已上传。');
      throw new LoadError('暂时无法读取笔记，请稍后重试。');
    }
    return await response.json();
  } catch (error) {
    if (error instanceof LoadError) throw error;
    if (controller.signal.aborted) throw new LoadError('读取超时，请检查网络后重试。');
    throw new LoadError('读取失败，请检查网络后重试。');
  } finally {
    clearTimeout(timeout);
  }
}
