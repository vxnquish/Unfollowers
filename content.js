// content.js
(async () => {
  console.log('[IG-Analyzer] content script injected');

  // 1) legacy window._sharedData
  let userId = window._sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user?.id
             || window.__initialData__?.entry_data?.ProfilePage?.[0]?.graphql?.user?.id;
  if (userId) {
    console.log('[IG-Analyzer] userId from sharedData:', userId);
    chrome.runtime.sendMessage({ type: 'SET_USER_ID', userId });
    return;
  }

  // 2) Next.js JSON blob
  const nextScript = document.getElementById('__NEXT_DATA__');
  if (nextScript?.textContent) {
    try {
      const nx = JSON.parse(nextScript.textContent);
      userId = nx.props?.pageProps?.user?.id
            || nx.props?.pageProps?.graphql?.user?.id;
      if (userId) {
        console.log('[IG-Analyzer] userId from __NEXT_DATA__:', userId);
        chrome.runtime.sendMessage({ type: 'SET_USER_ID', userId });
        return;
      }
    } catch (e) {
      console.warn('[IG-Analyzer] __NEXT_DATA__ parse error', e);
    }
  }

  console.warn('[IG-Analyzer] no sharedData; __NEXT_DATA__ fallback failed');

  // 3) HTML regex: look for profilePage_<ID> in the raw HTML
  const html = document.documentElement.innerHTML;
  const match = html.match(/profilePage_(\d+)/);
  if (match) {
    userId = match[1];
    console.log('[IG-Analyzer] userId from HTML regex:', userId);
    chrome.runtime.sendMessage({ type: 'SET_USER_ID', userId });
    return;
  }

  console.warn('[IG-Analyzer] HTML regex fallback failed');

  // 4) last resort: try the (now-deprecated) JSON endpoint
  try {
    const username = location.pathname.split('/').filter(Boolean)[0];
    const resp = await fetch(`https://www.instagram.com/${username}/?__a=1`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    const data = await resp.json();
    userId = data.graphql?.user?.id;
    if (userId) {
      console.log('[IG-Analyzer] userId from /?__a=1:', userId);
      chrome.runtime.sendMessage({ type: 'SET_USER_ID', userId });
      return;
    }
  } catch (e) {
    console.error('[IG-Analyzer] last-resort JSON fetch failed:', e);
  }

  console.error('[IG-Analyzer] all methods failed to load userId');
})();
