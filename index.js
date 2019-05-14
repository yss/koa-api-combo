/**
 * Created by yss on 6/16/17.
 */
'use strict';
const ApiRequest = require('./src/lib/apiRequest.js');
const Path = require('path');

const REG_URLS = /(\?|&)urls=([^&]+)(&?)/;
const rejectHandler = function () {
    return 'null';
};

/**
 * /combo?urls=/xx,/xxx&...
 *
 * @param {string} path
 * @param {Object} config the same as ApiRequest
 * @param {boolean} supportIgnoreError
 */
function Combo (path, config, supportIgnoreError) {
    const apiRequest = new ApiRequest(config);
    const ignorePath = supportIgnoreError && Path.join(path, 'ignore');

    return async function (ctx, next) {
        if (path !== ctx.path && ignorePath !== ctx.path) {
            return await next();
        }

        let urls = '';
        let search = ctx.search.replace(REG_URLS, function ($0, $1, $2, $3) {
            urls = decodeURIComponent($2);
            return $3 ? $1 : '';
        });

        if (!urls) {
            ctx.status = 400;
            ctx.body = {
                status: 400,
                message: 'urls must be exists'
            };
            return;
        }
        ctx.type = 'json';
        await Promise.all(
                urls.split(',').map(function (url) {
                    // FIX: inner network probing attack
                    if (url.indexOf('/') !== 0) {
                        url = '/' + url;
                    }
                    url += url.indexOf('?') > -1 ? search.replace('?', '&') : search;
                    if (supportIgnoreError) {
                        return apiRequest.get(ctx, url).catch(rejectHandler);
                    }
                    return apiRequest.get(ctx, url);
                })
            ).then(function (body) {
                ctx.body = '[' + body.join(',') + ']';
            }).catch(function (err) {
                if (err && err.status && err.body) {
                    ctx.status = err.status;
                    ctx.body = err.body;
                    return;
                }
                ctx.status = 404;
                ctx.body = {
                    status: 404,
                    message: (err && err.message) || 'request api error.'
                };
            });
    };
}

Combo.withIgnoreError = function (path, config) {
    return Combo(path, config, true);
};


module.exports = Combo;