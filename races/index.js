'use strict';

const {Race} = require('./models');
const {router} = require('./router');
const {basicStrategy, jwtStrategy} = require('../auth/strategies');

module.exports = {Race, router, basicStrategy, jwtStrategy};