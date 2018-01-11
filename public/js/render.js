/* global $ */
'use strict';

var render = {
  page: function(state) {
    $('.view').hide();

    // call fs for specific rendering
    const states = {
      public: render.electionResults,
      voting: render.electionBallot,
      'election-admin': render.raceAdminList,
      'race-edit': render.raceAdd,
      voted: render.electionResults
    };

    if(state.view in states) {
      states[state.view](state);
    }

    // show current panel
    $('#' + state.view).show();
    if (state.view === 'voted') {
      $('#public').show();
      $('.public-btn').hide();
      $('#public-logout-btn').show();
    }
    else {
      $('.public-btn').show();
      $('#public-logout-btn').hide();
    }
  },

  // Render election results to the page
  electionResults: function(state) {
    let racesHtml = '';
    let raceLabel = '';
    let voteSum;
    state.races.forEach(race => {
      race.city!=='n/a' ? raceLabel = `${race.city}, ${race.state}` : raceLabel = race.state;
      race.district!=='n/a' ? raceLabel += ` - dist ${race.district} ${race.type}` : raceLabel +=` ${race.type}`;
      racesHtml += ` 
      <div class="race-block col-4 col-6 box">
          <span class="race-label">${raceLabel}</span>`;
      voteSum = 0;
      race.candidates.forEach(candidate => {
        voteSum += candidate.candidate.votes;
      });
      race.candidates.forEach(candidate => {
        if(voteSum > 0) {
          racesHtml += `
            <li>${candidate.candidate.name} - ${candidate.candidate.votes.toLocaleString()} - 
                ${(candidate.candidate.votes/voteSum*100).toFixed(1)}%</li>`;
        }
        else {
          racesHtml += `
          <li>${candidate.candidate.name} - ${candidate.candidate.votes.toLocaleString()}</li>`;
        }
      });
      racesHtml += '</div>';
    });
    $('.row').html(racesHtml);
  },

  // Render voting ballots to the page
  electionBallot: function(state) {
    let racesHtml = '';
    let raceLabel = '';
    state.races.forEach(race => {
      race.city!=='n/a' ? raceLabel = `${race.city}, ${race.state}` : raceLabel = race.state;
      race.district!=='n/a' ? raceLabel += ` - dist ${race.district} ${race.type}` : raceLabel +=` ${race.type}`;
      racesHtml += `
        <div class="race-block col-4 col-6 box">
          <span class="race-label">${raceLabel}</span>
            <div>`;
      race.candidates.forEach(candidate => {
        racesHtml += ` 
          <label for="${candidate.candidate.name.replace(' ','-')}" class="radio-label">
            <input type="radio" id="${candidate._id}" name="${race._id}"
              value="${candidate.candidate.name}" />${candidate.candidate.name}
          </label>`;
      });
      racesHtml += '</div></div>';
    });
    $('.row').html(racesHtml);
  },

  // Render the editable/deletable races to the admin page
  raceAdminList: function(state) {
    let racesHtml = '';
    let raceLabel = '';
    state.races.forEach(race => {
      race.city!=='n/a' ? raceLabel = `${race.city}, ${race.state}` : raceLabel = race.state;
      race.district!=='n/a' ? raceLabel += ` - dist ${race.district} ${race.type}` : raceLabel +=` ${race.type}`;      
      racesHtml += `
        <div class="admin-race-block" id="${race._id}"d>
          <span class="race-label">${raceLabel}</span>`;
      race.candidates.forEach(candidate => {
        racesHtml += `
          <li>${candidate.candidate.name}</li>`;
      });
      racesHtml += `
          <button type="button" id="e-${race._id}" class="small-button race-edit-btn">Edit</button>
          <button type="button" id="d-${race._id}" class="small-button race-delete-btn">Delete</button>
        </div>`;
    });
    $('.row').html(racesHtml);
  },

  // Adds a single race to the admin page
  raceAdd: function(state) {
    $('.race-input-candidate').hide();
    $('.delete-candidate-btn').hide();
    $('#candidate-1').show();
    $('#del-1').show();
    if(state.editingRaceId) {
      const currRace = state.races.filter(el => el._id === state.editingRaceId)[0];
      $('#edited-race-id').text(currRace._id);
      $('#race-type').val(currRace.type);
      $('#city').val(currRace.city);
      $('#state').val(currRace.state);
      $('#district').val(currRace.district);
      let i = 0;
      currRace.candidates.forEach(candidate => {
        i++;
        $('#candidate-' + i).show();
        $('#candidate-' + i).val(currRace.candidates[i-1].candidate.name);
        $('#del-' + i).show();
      });      
    }
  },

  // Adds a candidate box to the add race form
  candidateAdd: function(state) {
    $('#candidate-' + state.visibleCandidates).show();
    $('#del-' + state.visibleCandidates).show();
  },  

  // Deletes a candidate box on the add race form
  candidateDel: function(state, candidateArr) {
    $('.race-input-candidate').hide();
    $('.delete-candidate-btn').hide();
    $('.race-input-candidate').val('');
    for (let i = 0; i < candidateArr.length; i++) {
      $('#candidate-' + (i+1)).show();
      $('#del-' + (i+1)).show();
      $('#candidate-' + (i+1)).val(candidateArr);
    }
  },

  // Clears out the add race form
  clearRaceEdit: function(state) {
    $('.race-input').val('');
    $('.race-input-candidate').val('');
    $('#edited-race-id').text('');
    render.raceAdd(state);   
  }

}; 