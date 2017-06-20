/**
 * Created by yss on 6/16/17.
 */
'use strict';
const dns = require('dns');
const Http = require('http');
const Https = require('https');
const Assert = require('assert');

const CONF_AGENT = {
    keepAlive: true,
    keepAliveMsecs: 4096,
    maxSockets: Number.MAX_SAFE_INTEGER,
    maxFreeSockets: 256
};
const HttpAgent = new Http.Agent(CONF_AGENT);
const HttpsAgent = new Https.Agent(CONF_AGENT);

class ApiRequest {

    /**
     * request data from api server
     *
     * @param config
     * @param {string} config.apiHost
     * @param {string} [config.protocol=http] the protocol that request api server
     * @param {number} [config.dnsCacheTime=10] the time for dns cache, default 10 seconds, do not use dns cache if set 0
     * @param {number} [config.timeout=10] timeout for each api request, default 10 seconds
     * @param {string} [config.headers='Cookie,User-Agent,Referrer'] the header you want to send to api server
     */
    constructor (config) {
        Assert(!!config.apiHost, 'apiHost must exists');
        this.config = {
            host: config.apiHost,
            family: undefined,
            timeout: (config.timeout || 10) * 1000
        };

        if (config.dnsCacheTime !== 0) {
            this._lookup(config.apiHost, (config.dnsCacheTime || 10) * 1000);
        }
        if (config.protocol === 'https') {
            this.client = Https;
            this.agent = HttpsAgent;
        } else {
            this.client = Http;
            this.agent = HttpAgent;
        }
        this.headers = (config.headers || 'Cookie,User-Agent,Referrer').split(',');
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
        let headers = {};

        this.headers.forEach(function (key) {
            headers[key] = ctx.get(key) || '';
        });

        return headers;
    }

    get (ctx, path) {
        let options = Object.assign({
            path,
            agent: this.agent,
            headers: this._getHeaders(ctx)
        }, this.config);

        return new Promise((resolve, reject) => {
            const req = this.client.request(options, function (res) {
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
