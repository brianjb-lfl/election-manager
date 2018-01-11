'use strict';

const RACES_URL = '/api/races/';
const VOTE_URL = '/api/races/votes/';
const LOCAL_URL = '/api/races/local/';
const USERS_URL = '/api/users/';
const VOTED_URL = '/api/users/setVote/';
const LOGIN_URL = '/api/auth/login/';

var api = {
  
  signup: function (username, password, city, userState, district, adminUser) {
    const url = buildUrl(USERS_URL);
    const body = {
      username: username,
      password: password,
      city: city,
      state: userState,
      district: district,
      adminUser: adminUser
    };

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(normalizeResponseErrors)
      .then(res => res.json());
  },
  
  login: function (username, password) {
    const url = buildUrl(LOGIN_URL);
    const base64Encoded = window.btoa(`${username}:${password}`);

    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64Encoded}`,
        'Accept': 'application/json'
      }
    }).then(normalizeResponseErrors)
      .then(res => res.json());
  },
  
  // Searches for races by the user's location
  searchLoc: function (state) {
    let query = {};
    query['state'] = state.userInfo.state;
    query.city = state.userInfo.city;
    query.district=state.userInfo.district;
    const url = buildUrl(LOCAL_URL, query);
    return fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
    })
      .then(normalizeResponseErrors)
      .then(res => res.json());
  },

  // Searches for all existing races
  search: function (query) {
    const url = buildUrl(RACES_URL, query);
    return fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }).then(normalizeResponseErrors)
      .then(res => res.json());
  },
  
  // Finds a specific race
  details: function (id) {
    const url = buildUrl(`${RACES_URL}${id}`);
    return fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }).then(normalizeResponseErrors)
      .then(res => res.json());
  },
  
  // Creates a new race
  create: function (document, token) {
    const url = buildUrl(`${RACES_URL}`);
    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: document ? JSON.stringify(document) : null
    }).then(normalizeResponseErrors)
      .then(res => res.json());
  },  
  
  // Updates a specific race
  update: function (document, token) {
    const url = buildUrl(`${RACES_URL}${document.id}`);
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: document ? JSON.stringify(document) : null
    }).then(normalizeResponseErrors);
  },
  
  // Updates the vote count of the selected candidate
  vote: function (document, token) {
    const url = buildUrl(`${VOTE_URL}${document._id}`);
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: document ? JSON.stringify(document) : null
    }).then(normalizeResponseErrors);
  },
  
  // Updates the user's "hasVoted" status
  updateVoted: function (document, token) {
    const url = buildUrl(`${VOTED_URL}${document.username}`);
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: document ? JSON.stringify(document) : null
    }).then(normalizeResponseErrors);
  },

  // Removes a race
  remove: function (id, token) {
    const url = buildUrl(`${RACES_URL}${id}`);
    return fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }).then(normalizeResponseErrors)
      .then(res => res.text());
  },
};

// Takes the parameters to build the necessary URL for a function
function buildUrl(path, query) {
  var url = new URL(path, window.location.origin);
  if (query) {
    Object.keys(query).forEach(key => url.searchParams.append(key, query[key]));
  }
  return url;
}

function normalizeResponseErrors(res) {
  if (!res.ok) {
    if (
      res.headers.has('content-type') &&
      res.headers.get('content-type').startsWith('application/json')
    ) {
      return res.json().then(err => Promise.reject(err));
    }
    return Promise.reject({
      code: res.status,
      message: res.statusText
    });
  }
  return res;
}
