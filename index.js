/**
 * Created by yss on 6/16/17.
 */
'use strict';
const ApiRequest = require('./src/lib/apiRequest.js');
const Path = require('path');

const REG_URLS = /(\?|&)urls=([^&]+)(&?)/;
const rejectHandler = function () {
    return null;
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
                    if (supportIgnoreError && ignorePath === ctx.path) {
                        return apiRequest.get(ctx, url).catch(rejectHandler);
                    }
                    return apiRequest.get(ctx, url);
                })
            ).then(function (results) {
                ctx.body = '[' + results.map(function (result) {
                    if (result === null) {
                        return 'null';
                    }
                    const len = result.length -1;
                    // first and end char is {} or []
                    if ((result[0] === 123 && result[len] === 125) ||
                            (result[0] === 91 && result[len] === 93)) {
                        return result;
                    }
                    return JSON.stringify(result.toString());
                }).join(',') + ']';
            }).catch(function (err) {
                const status = (err && err.status) || 424;
                ctx.status = status;
                ctx.body = {
                    status,
                    path: err && err.path,
                    message: (err && (err.body || err.message)) || 'error'
                };
            });
    };
}

Combo.withIgnoreError = function (path, config) {
    return Combo(path, config, true);
};


module.exports = Combo;