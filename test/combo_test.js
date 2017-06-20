/**
 * Created by yss on 6/16/17.
 */
'use strict';

require('should');
const Combo = require('../index.js');

// describe('Koa-api-combo', function () {
// });
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    'Cookie': 'count=1',
    // 'referrer': ''
};

const PATH_JSON = '/static/test/';
const RESULT_COMBO_A = [{ a: 1 }];
const RESULT_COMBO_B = [{ b: 1 }];
const RESULT_COMBO_C = [{ c: 1 }];

/**
 *
 * @param {Object} obj
 * @param {Object} obj.ctx
 * @param {Object} obj.combo
 * @param {Function} obj.next
 * @param {Function} callback
 */
async function simulator(obj, callback) {
    obj = obj || {};

    let ctx = Object.assign({
        path: '/combo',
        get (key) {
            return HEADERS[key];
        }
    }, obj.ctx || {});

    if (ctx.urls) {
        ctx.path += '?urls=' + encodeURIComponent(ctx.urls);
    }

    if (!ctx.search) {
        ctx.search = ctx.path.substring(ctx.path.indexOf('?') || 0);
    }

    ctx.path = ctx.path.split('?')[0];

    let combo = Object.assign({
        apiHost: 'blog.yssbox.com'
    }, obj.combo || {});

    try {
        await Combo('/combo', combo)(ctx, obj.next || async function (){});
    } catch (e) {
        console.error(e);
    }

    if (callback) {
        if (typeof ctx.body === 'string') {
            ctx.body = JSON.parse(ctx.body);
        }
        return callback(ctx);
    }
}

describe('Koa-Api-Combo', function () {
    describe('Request', function () {
        it('should be return correct value when get with http protocol', function () {
            return simulator({
                ctx: {
                    urls: PATH_JSON + 'a.json'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A);
            });
        });

        it('should be return correct value when get with https protocol', function () {
            return simulator({
                ctx: {
                    urls: '/yss/koa-api-combo/master/test/data/a.json'
                },
                combo: {
                    apiHost: 'raw.githubusercontent.com',
                    protocol: 'https'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A);
            });
        });

        it('should be return correct value when get multiple requests with http protocol', function () {
            return simulator({
                ctx: {
                    urls: PATH_JSON + 'a.json,' + PATH_JSON + 'b.json,' + PATH_JSON + 'c.json'
                }
            }, async function(ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A.concat(RESULT_COMBO_B).concat(RESULT_COMBO_C));
            });
        });

        it('should be return correct value when get multiple requests with https protocol', function () {
            return simulator({
                ctx: {
                    urls: '/yss/koa-api-combo/master/test/data/a.json,/yss/koa-api-combo/master/test/data/b.json,/yss/koa-api-combo/master/test/data/c.json'
                },
                combo: {
                    apiHost: 'raw.githubusercontent.com',
                    protocol: 'https'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A.concat(RESULT_COMBO_B).concat(RESULT_COMBO_C));
            });
        });
    });

    describe('Query In Different Position', function () {
        it('should be return correct value when get multiple requests with http protocol.', function () {
            return simulator({
                ctx: {
                    path: '/combo?p=1&urls=' + encodeURIComponent(PATH_JSON + 'a.json,' + PATH_JSON + 'b.json?p=2,' + PATH_JSON + 'c.json?c=2') + '&c=1'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A.concat(RESULT_COMBO_B).concat(RESULT_COMBO_C));
            });
        });
    });
});
