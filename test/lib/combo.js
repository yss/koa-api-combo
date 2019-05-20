/**
 * created by yss on 2019/05/20
 */
'use strict';
const { RESULT_COMBO_A, RESULT_COMBO_B, RESULT_COMBO_C, RESULT_COMBO_D, RESULT_COMBO_D_HTTP } = require('../data/data');
const PATH_JSON = '/static/test/';

module.exports = function (simulator) {
    describe('Request', function () {
        it('should be return correct value when get with http protocol', function () {
            return simulator({
                ctx: {
                    path: '/combo',
                    urls: 'a.json'
                },
                combo: {
                    apiHost: 'localhost',
                    protocol: 'http',
                    dnsCacheTime: 0,
                    port: 1337
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A);
            });
        });

        it('should be return correct value when get with https protocol', function () {
            return simulator({
                ctx: {
                    path: '/combo',
                    urls: PATH_JSON + 'b.json'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_B);
            });
        });

        it('should be return correct text value when get with https protocol and use compress:true', function () {
            return simulator({
                ctx: {
                    path: '/combo',
                    urls: PATH_JSON + 'd.txt'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_D);
            });
        });

        it('should be return correct value when get multiple requests with https protocol', function () {
            return simulator({
                ctx: {
                    path: '/combo',
                    urls: PATH_JSON + 'a.json,' + PATH_JSON + 'b.json,' + PATH_JSON + 'c.json'
                }
            }, async function(ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A.concat(RESULT_COMBO_B).concat(RESULT_COMBO_C));
            });
        });

        it('should be return correct value when get multiple requests with http protocol', function () {
            return simulator({
                ctx: {
                    path: '/combo',
                    urls: 'a.json,d.txt,c.json'
                },
                combo: {
                    apiHost: 'localhost',
                    protocol: 'http',
                    dnsCacheTime: 0,
                    port: 1337
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A.concat(RESULT_COMBO_D_HTTP).concat(RESULT_COMBO_C));
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
        it('should be return correct value when get multiple requests with https protocol.', function () {
            return simulator({
                ctx: {
                    path: '/combo?p=1&urls=' + encodeURIComponent(PATH_JSON + 'd.txt,' + PATH_JSON + 'b.json?p=2,' + PATH_JSON + 'c.json?c=2') + '&c=1'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_D.concat(RESULT_COMBO_B).concat(RESULT_COMBO_C));
            });
        });
    });
};