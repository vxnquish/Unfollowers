// popup.js
const resultsEl = document.getElementById('results');

// Wrap chrome.runtime.sendMessage in a Promise, returning just the username
function fetchList(action) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action }, resp => {
      if (resp.error) return reject(resp.error);
      const names = resp.list.map(e => e.node.username);
      resolve(names);
    });
  });
}

// Render an array of usernames
function renderList(arr) {
  if (!arr || arr.length === 0) {
    resultsEl.innerHTML = '<li>(none)</li>';
  } else {
    resultsEl.innerHTML = arr.map(u => `<li>${u}</li>`).join('');
  }
}

// Load Followers
document.getElementById('btnFollowers')
  .addEventListener('click', () => {
    resultsEl.innerHTML = '<li>Loading…</li>';
    fetchList('GET_FOLLOWERS')
      .then(renderList)
      .catch(err => {
        resultsEl.innerHTML = `<li style="color:red">${err}</li>`;
      });
  });

// Load Following
document.getElementById('btnFollowing')
  .addEventListener('click', () => {
    resultsEl.innerHTML = '<li>Loading…</li>';
    fetchList('GET_FOLLOWING')
      .then(renderList)
      .catch(err => {
        resultsEl.innerHTML = `<li style="color:red">${err}</li>`;
      });
  });

// Who Doesn’t Follow Me Back
document.getElementById('btnNonFollowers')
  .addEventListener('click', () => {
    resultsEl.innerHTML = '<li>Loading…</li>';
    Promise.all([
      fetchList('GET_FOLLOWERS'),
      fetchList('GET_FOLLOWING')
    ])
    .then(([followers, following]) => {
      const followersSet = new Set(followers);
      const nonFollowers = following.filter(u => !followersSet.has(u));
      renderList(nonFollowers);
    })
    .catch(err => {
      resultsEl.innerHTML = `<li style="color:red">${err}</li>`;
    });
  });
