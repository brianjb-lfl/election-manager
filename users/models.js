'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// Schema for a user
const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
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
  adminUser: {
    type: Boolean,
    required: true,
    default: false
  },
  hasVoted: {
    type: Boolean,
    required: true,
    default: false
  }
});

// Returns the created user with a specific format
UserSchema.methods.apiRepr = function () {
  return { 
    username: this.username, 
    city: this.city, 
    state: this.state, 
    district: this.district, 
    adminUser: this.adminUser,
    hasVoted: this.hasVoted };
};

// Checks if the inputted password matches the encrypted password in the user database
UserSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Encrypts the user-created password
UserSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = { User };
