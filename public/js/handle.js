/* global $, render, api refreshApp */
/* eslint no-console: "off" */
'use strict';

var handle = {
  tempLogin: function(event) {
    const state = event.data;
    state.view = 'login';
    render.page(state);
  },

  tempSignup: function(event) {
    const state = event.data;
    state.view = 'signup';
    render.page(state);
  },

  publicCancel: function(event) {
    const state = event.data;
    state.userInfo = {adminUser: 'start'};
    state.view = 'public';
    refreshApp();
  },

  submitVotes: function(event) {
    const state = event.data;
    countVotes(state);
  },

  logoutAfterVote: function(event) {
    const state = event.data;
    state.userInfo = {adminUser: 'start'};
    state.view = 'public';
    refreshApp();
  },

  // Handles the actions on the admin page
  electionAdmin: function(event) {
    const state = event.data;
    if(event.target.id === 'go-new-race-btn'){
      state.visibleCandidates = 1;
      state.view = 'race-edit';
      render.page(state);
    }
    else if(event.target.id === 'cancel-election-admin-btn'){
      state.view = 'public';
      refreshApp();
    }
    else if(event.target.id.charAt(0) === 'd'){
      handle.raceDelete(event.target.id, state);
    }
    else if(event.target.id.charAt(0) === 'e'){
      state.editingRaceId = event.target.id.slice(2);
      state.visibleCandidates = state.races.filter(el => el._id === state.editingRaceId)[0].candidates.length;
      state.view = 'race-edit';
      render.page(state);
    }
  },

  newCandidate: function(event) {
    const state = event.data;
    if(state.visibleCandidates < 9) {
      state.visibleCandidates += 1;
      render.candidateAdd(state);
    } 
  },

  editRacePost: function(event) {
    const state = event.data;
    let raceObj = getRaceObject(state);
    state.editingRaceId ? handle.updateRace(state, raceObj) : handle.postNewRace(state, raceObj);
  },

  postNewRace: function(state, raceObj) {
    api.create(raceObj, state.token)
      .then(response => {
        state.view = 'election-admin';
        refreshApp();
      })
      .catch(err => {
        if (err.code === 401) {
          state.view = 'election-admin';
        }
        console.error(err);
      });
  },

  updateRace: function(state, raceObj) {
    raceObj.id = state.editingRaceId;
    api.update(raceObj, state.token)
      .then(response => {
        state.view = 'election-admin';
        refreshApp();
      })
      .catch(err => {
        if (err.code === 401) {  
          state.view = 'election-admin';
        }
        console.error(err);        
      });
  },

  raceDelete: function(id, state) {
    id = id.slice(2);
    return api.remove(id, state.token)
      .then(() => {
        state.view = 'election-admin';})
      .then(() => {
        refreshApp();
      })
      .catch(err => {
        if (err.code === 401) {
          state.view = 'election-admin';
        }
        console.error(err);
      });
  },

  cancelNewRace: function(event) {
    const state = event.data;
    state.editingRaceId = null;
    state.view = 'election-admin';
    render.clearRaceEdit(state);
    render.page(state);
  },

  deleteCandidate: function(event) {
    const state = event.data;
    let candidateArr = [];
    const deletedCandidate = Number((event.target.id).charAt(event.target.id.length-1));

    for (let i = 1; i <= state.visibleCandidates; i++) {
      if (i !== deletedCandidate) { 
        candidateArr.push($('#candidate-'+ i).val());
      }
    }
    state.visibleCandidates--;
    render.candidateDel(state, candidateArr);
  },
  

  signup: function(event) {
    event.preventDefault();
    const state = event.data;
    const el = $(event.target);
    const username = el.find('[name=username]').val().trim();
    const password = el.find('[name=password]').val().trim();
    const city = el.find('[name=city]').val().trim();
    const userState = el.find('[name=state]').val().trim();
    const district = el.find('[name=district]').val().trim();
    const adminUser = $('#signup-admin').is(':checked');
    const hasVoted = false;
    el.trigger('reset');
    api.signup(username, password, city, userState, district, adminUser)
      .then(() => {
        state.view = 'login';
        render.page(state);
      })
      .catch(err => {
        if (err.reason === 'ValidationError') {
          console.error(err.reason, err.message);
        } else {
          console.error(err);
        }
      });
  },

  login: function (event) {
    event.preventDefault();
    const state = event.data;
    const el = $(event.target);
    const username = el.find('[name=username]').val().trim();
    const password = el.find('[name=password]').val().trim();

    api.login(username, password)
      .then(response => {
        state.token = response.authToken;
        localStorage.setItem('authToken', state.token);
        function parseJwt (token) {
          var base64Url = token.split('.')[1];
          var base64 = base64Url.replace('-', '+').replace('_', '/');
          return JSON.parse(window.atob(base64));}
        console.log(parseJwt(response.authToken));
        
        const tokenObj = parseJwt(response.authToken).user;
        const{username, city, district, hasVoted, adminUser} = tokenObj;
        state.userInfo = {username, city, district, hasVoted, adminUser};
        state.userInfo['state'] = tokenObj.state; 
        state.userInfo.adminUser ? state.view = 'election-admin' : 
          state.userInfo.hasVoted ? state.view = 'voted' : state.view = 'voting';
        refreshApp();
      })
      .catch(err => {
        if (err.reason === 'ValidationError') {
          console.error(err.reason, err.message);
        } else {
          console.error(err);
        }
      });
  },

  viewLogin: function (event) {
    event.preventDefault();
    const state = event.data;
    state.view = 'login';
    render.page(state);
  },
  
  viewSignup: function (event) {
    event.preventDefault();
    const state = event.data;
    state.view = 'signup';
    render.page(state);
  },

};

// Finds selected candidate, who will receive the vote upon submission
function countVotes(state) {
  let promiseArr = [];
  state.races.forEach(race => {
    let searchObj = {};
    searchObj['_id'] = race._id;
    searchObj['candidates._id'] = $(`input[name=${race._id}]:checked`).attr('id');
    promiseArr.push(api.vote(searchObj, state.token));
  });
  Promise.all(promiseArr)
    .then( () => {
      let searchObj = {};
      searchObj.username = state.userInfo.username;
      return api.updateVoted(searchObj, state.token);
    })
    .then( () => {
      state.view = 'voted';
      refreshApp();
    });
}

// Returns the race data that will be updated
function getRaceObject(state) {
  let raceObject = {};
  raceObject.type = $('#race-type').val();         
  raceObject.city = $('#city').val();
  raceObject.state = $('#state').val();
  raceObject.district = $('#district').val();
  raceObject.candidates = [];
  for(let i = 1; i <= state.visibleCandidates; i++) {
    if($('#candidate-' + i)) {
      raceObject.candidates.push(
        {candidate: {
          name: $('#candidate-' + i).val(),
          votes: 0}
        }
      );
    }
  }

  render.clearRaceEdit(state);
  return raceObject;
}


