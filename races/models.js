'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// Schema for election race
const RaceSchema = mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  candidates: [{
    candidate: {
      name: {
        type: String,
        required: true
      },
      votes: {
        type: Number,
        default: 0
      }
    }
  }]
});

// Combines the state and district into a string
RaceSchema.virtual('raceLabel')
  .get(function() {
    return `${this.state} - Dist ${this.district}`;
  });

// Returns the created race with a specific format
RaceSchema.methods.apiRepr = function () {
  return {
    id: this._id,
    type: this.type,
    city: this.city,
    state: this.state,
    district: this.district,
    candidates: this.candidates,
    label: this.raceLabel
  };
};

const Race = mongoose.models.Race || mongoose.model('Race', RaceSchema);

module.exports = { Race };