/**
 * Created by yss on 6/16/17.
 */
'use strict';
const dns = require('dns');
const Http = require('http');
const Assert = require('assert');

const Agent = require('http').Agent;

const agent = new Agent({
    keepAlive: true,
    keepAliveMsecs: 4096,
    maxSockets: Number.MAX_SAFE_INTEGER,
    maxFreeSockets: 256
});

class ApiRequest {

    /**
     *
     * @param config
     * @param {string} config.apiHost
     * @param {number} [config.dnsCacheTime=10] the time for dns cache, default 10 seconds
     * @param {number} [config.timeout=10] timeout for each api request, default 10 seconds
     * @param {string} [config.headers='cookie,user-agent,referrer']
     */
    constructor (config) {
        Assert(!!config.apiHost, 'apiHost must exists');
        this.config = {
            host: config.apiHost,
            family: undefined,
            timeout: (config.timeout || 10) * 1000
        };

        this._lookup(config.apiHost, (config.dnsCacheTime || 10) * 1000);
        this.headers = (config.headers || 'cookie,user-agent,referrer').split(',');
    }

    /**
     * lookup the ip and family of apiHost
     * and run each timeout
     *
     * @param {string} apiHost
     * @param {number} timeout
     */
    _lookup (apiHost, timeout) {
        dns.lookup(apiHost, (err, ip, family) => {
            if (err) {
                return console.error(err);
            }

            this.config.host = ip;
            this.config.family = family;

            setTimeout(this._lookup.bind(this, apiHost, timeout), timeout).unref();
        });
    }

    _getHeaders (ctx) {
        return this.headers.map(key => ctx.get(key));
    }

    get (ctx, path) {
        let options = Object.assign({
            path,
            agent,
            // headers: this._getHeaders(ctx)
        }, this.config);
        return new Promise(function (resolve, reject) {
            const req = Http.request(options, function (res) {
                let body = '';
                res.on('data', function (chunk) {
                    body += chunk;
                });

                res.on('end', function () {
                    let statusCode = res.statusCode;
                    if (statusCode < 200 || statusCode >= 300) {
                        return reject({
                            status: statusCode,
                            body: body
                        });
                    }

                    resolve(body);
                });

                res.on('error', reject);
            });

            req.on('error', reject);
            req.end();
        });
    }
}

module.exports = ApiRequest;
