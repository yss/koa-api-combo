/**
 * Created by yss on 6/16/17.
 */
'use strict';

const Combo = require('../index.js');

// describe('Koa-api-combo', function () {
// });

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
        path: '/combo'
    }, obj.ctx || {});

    ctx.search = ctx.path.substring(ctx.path.indexOf('?') || 0);

    let combo = Object.assign({
        apiHost: 'ke.yuanfudao.ws'
    }, obj.combo || {})

    try {
        await Combo('/combo', combo)(ctx, obj.next || async function (){});
    } catch (e) {
        console.error(e);
    }

    if (callback) {
        callback(ctx);
    }
}

simulator({
    ctx: {
        path: '/combo?urls=' + encodeURIComponent('/tutor-lesson/api/lessons/3072502,/tutor-lesson/api/lessons/32044848')
    }
}, function (ctx) {
    console.log(ctx.body);
})
