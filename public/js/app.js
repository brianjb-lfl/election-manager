/* global jQuery, handle render dummyData api*/
'use strict';

// Make STORE global so it can be easily qu
var STORE;
//on document ready bind events
jQuery(function ($) {

  STORE = {
    view: 'public', // signup | login | public | voting | voted | election-admin | race-edit 
    backTo: null,
    query: {},      // search query values
    visibleCandidates: 0,   // candidates displayed on add/edit race page
    editingRaceId: null,     // current race being edited
    list: null,     // search result - array of objects (documents)
    item: null,     // currently selected document
    token: localStorage.getItem('authToken'), // jwt token
    userInfo: {adminUser: 'start'}, // holds current user information
    races: []
  };

  // Setup all the event listeners, passing STATE and event to handlers
  $('#public-login-btn').on('click', STORE, handle.tempLogin);
  $('#public-signup-btn').on('click', STORE, handle.tempSignup);
  $('#public-logout-btn').on('click', STORE, handle.logoutAfterVote);
  $('.public-cancel').on('click', STORE, handle.publicCancel);
  $('#submit-votes-btn').on('click', STORE, handle.submitVotes);
  $('#election-admin').on('click', 'button', STORE, handle.electionAdmin);
  $('#new-race-post-btn').on('click', STORE, handle.editRacePost);  
  $('#new-race-cancel-btn').on('click', STORE, handle.cancelNewRace);  
  $('#add-candidate-btn').on('click', STORE, handle.newCandidate);
  $('.delete-candidate-btn').on('click', STORE, handle.deleteCandidate);

  $('#signup').on('submit', STORE, handle.signup);
  $('#login').on('submit', STORE, handle.login);

  $('#signup').on('click', '.viewLogin', STORE, handle.viewLogin);
  $('#login').on('click', '.viewSignup', STORE, handle.viewSignup);  

  refreshApp();
  
});

// Gets the current data from the API and renders it given a certain page state
function refreshApp() {
  if(STORE.userInfo.adminUser === false) {
    return api.searchLoc(STORE)
      .then(response => {
        STORE.races = response;
      })
      .then( () => {
        render.page(STORE);
      });  
  }
  else {
    return api.search()
      .then(response => {
        STORE.races = response;
      })
      .then( () => {
        render.page(STORE);
      });
  }
}
