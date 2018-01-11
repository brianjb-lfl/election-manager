'use strict';

global.DATABASE_URL = 'mongodb://localhost/jwt-auth-demo-test';
process.env.NODE_ENV = 'test';
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const { app, runServer, closeServer } = require('../server');
const { Race } = require('../races');
const { JWT_SECRET } = require('../config');

const expect = chai.expect;

chai.use(chaiHttp);

describe('/api/race', function() {
  const type = 'test race2';
  const city = 'Tysons Corner';
  const state = 'VA';
  const district = '11';
  const candidates = [{candidate: 
    {name: 'Robert', votes: 0}}];

  before(function () {
    return runServer('mongodb://localhost/jwt-auth-demo-test');
  });

  after(function () {
    return closeServer();
  });

  beforeEach(function () {
    return Race.create({
      type: 'test race',
      city: 'McLean',
      state: 'VA',
      district: '11',
      candidates: [{candidate: 
        {name: 'Bob', votes: 0}}]
    });
  });

  afterEach(function () {
    return Race.remove({});
  });

  describe('/api/races', function () {
    describe('GET', function () {
      it('Should return all existing races', function() {
        return chai
          .request(app)
          .get('/api/races')
          .then(function (res) {
            expect(res).to.have.status(200);
            expect(res.body.length).to.be.above(0);
            expect(res.body).to.be.an('array');
            res.body.forEach(function(race) {
              expect(race).to.be.an('object');
              expect(race).to.include.keys('type', 'city', 'district', 'state', 'candidates');
            });
            expect(res).to.be.json;
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
      it('Should return only races from the user locale', function() {
        return chai
          .request(app)
          .get('/api/races/local/?state=VA&city=McLean&district=11')
          .then(function (res) {
            expect(res).to.have.status(200);
            expect(res.body.length).to.be.above(0);
            expect(res.body).to.be.an('array');
            res.body.forEach(function(race) {
              expect(race).to.be.an('object');
              expect(race).to.include.keys('type', 'city', 'district', 'state', 'candidates');
            });
            expect(res).to.be.json;
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
      it('Should not return races where the race state doesnt match the user state', function() {
        return chai
          .request(app)
          .get('/api/races/local/?state=VA&city=Staunton&district=11')
          .then(function (res) {
            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(0);
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
      it('Should not return races where the race city doesnt match the user city', function() {
        return chai
          .request(app)
          .get('/api/races/local/?state=VA&city=Virginia&district=11')
          .then(function (res) {
            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(0);
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
      it('Should not return races where the race district doesnt match the user district', function() {
        return chai
          .request(app)
          .get('/api/races/local/?state=VA&city=McLean&district=99')
          .then(function (res) {
            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(0);
          })
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
          });
      });
      it('Should return the requested ID', function () {
        let race;
        return Race
          .findOne()
          .then(function (_race) {
            race = _race;
            return chai
              .request(app)
              .get(`/api/races/${race.id}`);
          })
          .then(function (res) {
            expect(res).to.have.status(200);
            expect(res).to.be.an('object');
            expect(res.body).to.include.keys('type', 'city', 'district', 'state', 'candidates');
            expect(res.body.type).to.deep.equal(race.type);
            expect(res.body.city).to.deep.equal(race.city);
            expect(res.body.district).to.deep.equal(race.district);
            expect(res.body.state).to.deep.equal(race.state);
            expect(res.body.candidates[0].candidate.name).to.deep.equal(race.candidates[0].candidate.name);
            expect(res.body.candidates[0].candidate.votes).to.deep.equal(race.candidates[0].candidate.votes);
          });
      });
    });
    describe('POST', function() {
      it('Should add a race', function () {
        const newRace = {type: type, city: city, state: state, district: district, candidates: candidates};
        const token = jwt.sign(
          {
            user: 'bmalin'
          },
          JWT_SECRET,
          {
            subject: 'bmalin',
            expiresIn: '7d'
          }
        );
        return chai
          .request(app)
          .post('/api/races')
          .set('authorization', `Bearer ${token}`)
          .send(newRace)
          .then(function(res) {
            expect(res).to.have.status(201);
            expect(res).to.be.an('object');
            expect(res.body).to.include.keys('type', 'city', 'district', 'state', 'candidates');
            return Race
              .findOne(res.body._id)
              .then(function (race) {
                expect(res.body.type).to.deep.equal(newRace.type);
                expect(res.body.city).to.deep.equal(newRace.city);
                expect(res.body.state).to.deep.equal(newRace.state);
                expect(res.body.district).to.deep.equal(newRace.district);
                expect(res.body.candidates[0].candidate.name).to.deep.equal(newRace.candidates[0].candidate.name);
                expect(res.body.candidates[0].candidate.votes).to.deep.equal( newRace.candidates[0].candidate.votes);
              });
          });
      });
    });
    describe('DELETE', function () {
      it('Should delete a race', function () {
        let race;
        return Race
          .findOne()
          .then(function (_race) {
            race = _race;
            const token = jwt.sign(
              {
                user: 'bmalin'
              },
              JWT_SECRET,
              {
                subject: 'bmalin',
                expiresIn: '7d'
              }
            );
            return chai
              .request(app)
              .delete(`/api/races/${race.id}`)
              .set('authorization', `Bearer ${token}`);
          })
          .then(function(res) {
            expect(res).to.have.status(204);
          });
      });
    });
    describe('PUT', function () {
      it('Should update a race', function () {
        const newRace = {type: type, city: city, state: state, district: district, candidates: candidates};
        let race;
        return Race
          .findOne()
          .then(function (_race) {
            race = _race;
            newRace.id = race._id;
            const token = jwt.sign(
              {
                user: 'bmalin'
              },
              JWT_SECRET,
              {
                subject: 'bmalin',
                expiresIn: '7d'
              }
            );
            return chai
              .request(app)
              .put(`/api/races/${race.id}`)
              .send(newRace)
              .set('authorization', `Bearer ${token}`);
          })
          .then(function(res) {
            expect(res).to.have.status(204);
          })
          .then(function() {
            return chai
              .request(app)
              .get(`/api/races/${race._id}`);
          })
          .then(function (res) {
            expect(res).to.have.status(200);
            expect(res).to.be.an('object');
            expect(res.body.type).to.deep.equal(newRace.type);
            expect(res.body.city).to.deep.equal(newRace.city);
            expect(res.body.candidates[0].candidate.name).to.deep.equal(newRace.candidates[0].candidate.name);
            expect(res.body.candidates[0].candidate.votes).to.deep.equal(0);
          });
      });
      it('Should add one vote', function () {
        let race;
        return Race
          .findOne()
          .then(function (_race) {
            race = _race;
            let raceId = race._id;
            let candidateId = race.candidates[0]._id;
            let searchString = {'_id': raceId, 'candidates._id': candidateId};
            const token = jwt.sign(
              {
                user: 'bmalin'
              },
              JWT_SECRET,
              {
                subject: 'bmalin',
                expiresIn: '7d'
              }
            );
            return chai
              .request(app)
              .put(`/api/races/votes/${raceId}`)
              .send(searchString)
              .set('authorization', `Bearer ${token}`);
          })
          .then(function(res) {
            expect(res).to.have.status(204);
          })
          .then(function() {
            return chai
              .request(app)
              .get(`/api/races/${race._id}`);
          })
          .then(function (res) {
            expect(res).to.have.status(200);
            expect(res).to.be.an('object');
            expect(res.body.candidates[0].candidate.name).to.deep.equal(race.candidates[0].candidate.name);
            expect(res.body.candidates[0].candidate.votes).to.deep.equal(1);
          });
      });
    });
  });
});