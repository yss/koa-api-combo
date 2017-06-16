/**
 * Created by yss on 6/16/17.
 */
'use strict';
const ApiRequest = require('./src/lib/apiRequest.js');

const REG_URLS = /(\?|&)urls=([^&]+)(&?)/;

/**
 * /combo?urls=/xx,/xxx&...
 *
 * @param {string} path
 * @param {Object} config
 * @param {string} config.apiHost
 * @param {number} [config.dnsCacheTime=10] the time for dns cache, default 10 seconds
 * @param {number} [config.timeout=10] timeout for each api request, default 10 seconds
 * @param {string} [config.headers='cookie,user-agent,referrer']
 */
function Combo (path, config) {
    const apiRequest = new ApiRequest(config);

    return async function (ctx, next) {
        if (ctx.path.indexOf(path) !== 0) {
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
        await Promise.all(urls.split(',').map(url => apiRequest.get(ctx, url + search)))
            .then(function (body) {
                ctx.body = '[' + body.join(',') + ']';
            }, function (err) {
                if (err && err.status && err.body) {
                    ctx.status = err.status;
                    ctx.body = err.body;
                    return;
                }
                ctx.status = 404;
                ctx.body = {
                    status: 404,
                    message: (err && err.message) || 'request api error'
                };
            });
    }
}

module.exports = Combo;