/**
 * created by yss on 2019/05/16
 */
'use strict';

const Combo = require('../../index.js');
/**
 *
 * @param {boolean} isComboIgnore
 * @param {Object} obj
 * @param {Object} obj.ctx
 * @param {Object} obj.combo
 * @param {Function} obj.next
 * @param {Function} callback
 */
async function simulator(isComboIgnore, obj, callback) {
    obj = obj || {};

    let ctx = Object.assign({
        path: isComboIgnore ? '/combo/ignore' : '/combo',
        get (key) {
            if (key === 'User-Agent') {
                return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' + Math.random().toString().substr(0, 3);
            }
            return '';
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
        apiHost: 'blog.yssbox.com',
        protocol: 'https'
    }, obj.combo || {});

    try {
        if (isComboIgnore) {
            await Combo.withIgnoreError('/combo', combo)(ctx, obj.next || async function (){});
        } else {
            await Combo('/combo', combo)(ctx, obj.next || async function (){});
        }
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

exports.Simulator = simulator;

const StaticServer = require('static-server');
const Path = require('path');
let server = null;
exports.Before = function (done) {
    server = new StaticServer({
        rootPath: Path.resolve(__dirname, '../data'),
        port: 1337
    });
    server.start(done);
};

exports.After = function () {
    server && server.stop();
};
