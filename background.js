// background.js
let cachedUserId = null;

// Listen for content script messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SET_USER_ID') {
    console.log('[IG-Analyzer] background received userId:', msg.userId);
    cachedUserId = msg.userId;
  }
});

// Helper to call IG’s private GraphQL endpoint
async function fetchIG(queryHash, variables) {
  const url = `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(JSON.stringify(variables))}`;
  const res = await fetch(url, { credentials: 'include' });
  return res.json();
}

// Fetch all pages of an edge (followers or following)
async function fetchAllList(queryHash, edgeName) {
  const allEdges = [];
  let hasNext = true;
  let after = null;

  while (hasNext) {
    const vars = { id: cachedUserId, first: 50, after };
    const resp = await fetchIG(queryHash, vars);
    const page = resp.data.user[edgeName];
    allEdges.push(...page.edges);
    hasNext = page.page_info.has_next_page;
    after   = page.page_info.end_cursor;
  }

  return allEdges;
}

// Handle popup requests
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!cachedUserId) {
    return sendResponse({ error: 'User not detected. Visit your profile first.' });
  }

  (async () => {
    try {
      let edges;
      switch (msg.action) {
        case 'GET_FOLLOWERS':
          edges = await fetchAllList(
            'c76146de99bb02f6415203be841dd25a',  // followers query hash
            'edge_followed_by'
          );
          return sendResponse({ list: edges });

        case 'GET_FOLLOWING':
          edges = await fetchAllList(
            'd04b0a864b4b54837c0d870b0e77e076',  // following query hash
            'edge_follow'
          );
          return sendResponse({ list: edges });

        default:
          return sendResponse({ error: 'Unknown action' });
      }
    } catch (e) {
      sendResponse({ error: e.message });
    }
  })();

  return true; // keep sendResponse channel open
});
