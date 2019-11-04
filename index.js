/**
 * Created by yss on 6/16/17.
 */
'use strict';
const ApiRequest = require('./src/lib/apiRequest.js');
const Path = require('path');

const REG_URLS = /(\?|&)urls=([^&?]+)(&?)/;
const rejectHandler = function () {
    return null;
};

/**
 * /combo?urls=/xx,/xxx&...
 *
 * @param {string} path is the route string. And should be exactly equal to `ctx.path`
 * @param {Object} apiRequestConfig the same as ApiRequest
 * @param {Object} comboConfig
 * @param {boolean} [comboConfig.supportIgnoreError] will use null instead the response data if request url error
 *      and need request by append `/ignore` to the `path` parameter if set to true
 * @param {Function} [comboConfig.isValidUrl] for filter possible illegal url if needed,
 *      and response 400 with parameters error
 *
 * @returns<Function>
 */
function Combo (path, apiRequestConfig, comboConfig = {}) {
    const apiRequest = new ApiRequest(apiRequestConfig);
    const supportIgnoreError = !!comboConfig.supportIgnoreError;
    const isValidUrl = comboConfig.isValidUrl;
    const ignorePath = supportIgnoreError && Path.join(path, 'ignore');

    function responseParametersError (ctx, message = 'parameters error') {
        ctx.status = 400;
        ctx.body = {
            status: 400,
            message
        };
    }
    function isValidUrls (urls) {
        return urls.every(function (url) {
            return !url.startsWith(path) &&
                    '/' === url[0] &&
                    (isValidUrl ? isValidUrl(url) : true);
        });
    }

    return async function (ctx, next) {
        if (path !== ctx.path && ignorePath !== ctx.path) {
            return await next();
        }

        let urlString = '';
        const search = ctx.search.replace(REG_URLS, function ($0, $1, $2, $3) {
            urlString = decodeURIComponent($2);
            return $3 ? $1 : '';
        });

        ctx.type = 'json';
        if (!urlString) {
            return responseParametersError(ctx, 'urls must be exists');
        }
        const urls = urlString.split(',');
        if (!isValidUrls(urls)) {
            return responseParametersError(ctx);
        }
        await Promise.all(
                urls.map(function (url) {
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

Combo.withIgnoreError = function (path, config, comboConfig = {}) {
    comboConfig.supportIgnoreError = true;
    return Combo(path, config, comboConfig);
};


module.exports = Combo;