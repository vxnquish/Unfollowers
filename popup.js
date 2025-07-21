// popup.js
const resultsEl = document.getElementById('results');

// Wrap chrome.runtime.sendMessage in a Promise, returning username + avatar
function fetchList(action) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action }, resp => {
      if (resp.error) return reject(resp.error);
      const items = resp.list.map(e => ({
        username: e.node.username,
        avatar:   e.node.profile_pic_url
      }));
      resolve(items);
    });
  });
}

// Render an array of { username, avatar }
function renderList(items) {
  if (!items || items.length === 0) {
    resultsEl.innerHTML = '<li class="loading">(none)</li>';
    return;
  }
  resultsEl.innerHTML = items.map(user => `
    <li>
      <img
        src="${user.avatar}"
        alt="${user.username}'s avatar"
      />
      <span>${user.username}</span>
    </li>
  `).join('');
}

// Load Followers
document.getElementById('btnFollowers')
  .addEventListener('click', () => {
    resultsEl.innerHTML = '<li class="loading">Loading…</li>';
    fetchList('GET_FOLLOWERS')
      .then(renderList)
      .catch(err => {
        resultsEl.innerHTML = `<li class="error">${err}</li>`;
      });
  });

// Load Following
document.getElementById('btnFollowing')
  .addEventListener('click', () => {
    resultsEl.innerHTML = '<li class="loading">Loading…</li>';
    fetchList('GET_FOLLOWING')
      .then(renderList)
      .catch(err => {
        resultsEl.innerHTML = `<li class="error">${err}</li>`;
      });
  });

// Who Doesn’t Follow Me Back
document.getElementById('btnNonFollowers')
  .addEventListener('click', () => {
    resultsEl.innerHTML = '<li class="loading">Loading…</li>';
    Promise.all([
      fetchList('GET_FOLLOWERS'),
      fetchList('GET_FOLLOWING')
    ])
    .then(([followers, following]) => {
      const followersSet = new Set(followers.map(u => u.username));
      const nonFollowers = following.filter(u => !followersSet.has(u.username));
      renderList(nonFollowers);
    })
    .catch(err => {
      resultsEl.innerHTML = `<li class="error">${err}</li>`;
    });
  });
