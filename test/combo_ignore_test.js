/**
 * Created by yss on 6/16/17.
 */
'use strict';

require('should');
const Combo = require('./lib/combo');
const { Simulator, Before, After } = require('./lib/simulator');
const { RESULT_COMBO_A, RESULT_COMBO_B, RESULT_COMBO_C, RESULT_COMBO_D, RESULT_COMBO_D_HTTP, RESULT_COMBO_NULL } = require('./data/data');
const PATH_JSON = '/static/test/';

describe('Koa-Api-Combo-Ignore', function () {
    this.timeout(9000);
    const simulator = Simulator.bind(null, true);
    before(Before);
    after(After);
    describe('Request', function () {
        it('should be return null when get with error path', function () {
            return simulator({
                ctx: {
                    urls: PATH_JSON + 'a1.json'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_NULL);
            });
        });

        it('should be return array with null and correct value when request a error path and correct path', function () {
            return simulator({
                ctx: {
                    urls: PATH_JSON + 'a1.json,' + PATH_JSON + 'a.json'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_NULL.concat(RESULT_COMBO_A));
            });
        });

        it('should be return correct value when get with https protocol and use compress:true', function () {
            return simulator({
                ctx: {
                    urls: PATH_JSON + 'b.json'
                },
                combo: {
                    compress: true
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_B);
            });
        });

        it('should be return correct value when get multiple requests with http protocol', function () {
            return simulator({
                ctx: {
                    urls: 'a1.json,b.json,d.txt'
                },
                combo: {
                    apiHost: 'localhost',
                    protocol: 'http',
                    dnsCacheTime: 0,
                    port: 1337
                }
            }, async function(ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_NULL.concat(RESULT_COMBO_B).concat(RESULT_COMBO_D_HTTP));
            });
        });

        it('should be return correct value when get multiple requests with https protocol', function () {
            return simulator({
                ctx: {
                    urls: PATH_JSON + 'a.json,' + PATH_JSON + 'd.txt,' + PATH_JSON + 'c.json'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A.concat(RESULT_COMBO_D).concat(RESULT_COMBO_C));
            });
        });

        it('should be go to next handle with other route', function () {
            return simulator({
                ctx: {
                    path: '/test'
                },
                next () {
                    arguments.length.should.be.equal(0);
                }
            }, function (ctx) {
                ctx.should.not.have.key('body');
            });
        });
    });

    describe('Query In Different Position', function () {
        it('should be return correct value when get multiple requests with http protocol.', function () {
            return simulator({
                ctx: {
                    path: '/combo/ignore?p=1&urls=' + encodeURIComponent(PATH_JSON + 'a.json,' + PATH_JSON + 'b.json?p=2,' + PATH_JSON + 'c.json?c=2') + '&c=1'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A.concat(RESULT_COMBO_B).concat(RESULT_COMBO_C));
            });
        });
    });

    describe('TEST FOR NORMAL COMBO', function () {
        Combo(simulator);
    });
});
