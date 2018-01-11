'use strict';

/* eslint no-console: "off" */

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const { Race } = require('./models');

const router = express.Router();

const jsonParser = bodyParser.json();
const jwtAuth = passport.authenticate('jwt', { session: false });

// Pulls all of the existing races from the API
router.get('/', jsonParser, (req, res)  => {
  Race
    .find()
    .then(races => {
      res.json(races);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Search failed'});
    });
} );

// Pulls location-specific races from the API - based on user's location
router.get('/local/', jsonParser, (req, res)  => {
  Race
    .find({ $or:[
      {state: req.query.state, city: 'n/a', district: 'n/a'},
      {state: req.query.state, city: req.query.city, district: 'n/a'},
      {state: req.query.state, city: req.query.city, district: req.query.district}
    ]})
    .then(races => {
      res.json(races);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Search failed'});
    });
});

// Pulls a specified race from the API
router.get('/:id', jsonParser, (req, res)  => {
  Race
    .findById(req.params.id)
    .then(race => {
      res.json(race.apiRepr());
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Search failed'});
    });
});

// Updates a specified race in the API
router.put('/:id', jsonParser, jwtAuth, (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    res.status(400).json({
      error: 'Request path id and request body id values must match'
    });
  }
  Race
    .findOneAndUpdate(
      {_id: req.params.id},
      req.body        
    )
    .then(race => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

// Increases a race's candidate's vote count by 1
router.put('/votes/:id', jsonParser, jwtAuth, (req, res) => {
  if(!(req.params.id && req.body._id && req.params.id === req.body._id)) {
    res.status(400).json({
      error: 'Request path id and body id values must match'
    });
  }
  Race
    .update({_id: req.body._id, 'candidates._id': req.body['candidates._id']},
      {$inc: {'candidates.$.candidate.votes': 1}}
    )
    .then(race => {
      res.status(204).end();
    })
    .catch(err => {
      res.status(500).json({message: 'Internal server error'});
    });
});

// Adds a race to the API
router.post('/', jsonParser, jwtAuth, (req, res) => {
  const requiredFields = ['type', 'city', 'state', 'district'];
  const missingField = requiredFields.find(field => !(field in req.body));
  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  Race
    .create({
      type: req.body.type,
      city: req.body.city,
      state: req.body.state,
      district: req.body.district,
      candidates: req.body.candidates})
    .then(
      race => res.status(201).json(race.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });
});

// Deletes a specified race from the API
router.delete('/:id', jwtAuth, (req, res) => {
  
  Race
    .findByIdAndRemove(req.params.id)
    .then(() => {
      console.log(`Deleted race with id = ${req.params.id}`);
      res.status(204).end();
    });
});


module.exports = { router };