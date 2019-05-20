/**
 * Created by yss on 6/16/17.
 */
'use strict';

require('should');
const Combo = require('./lib/combo');
const { Simulator, Before, After } = require('./lib/simulator');

describe('Koa-Api-Combo', function () {
    const simulator = Simulator.bind(null, false);
    this.timeout(15000);
    before(Before);
    after(After);
    Combo(simulator);
});
