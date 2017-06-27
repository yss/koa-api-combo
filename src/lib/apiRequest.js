/**
 * Created by yss on 6/16/17.
 */
'use strict';
const dns = require('dns');
const Http = require('http');
const Https = require('https');
const Zlib = require('zlib');
const Assert = require('assert');

const OPTION_ZLIB = {
    flush: Zlib.Z_SYNC_FLUSH,
    finishFlush: Zlib.Z_SYNC_FLUSH
};

const OPTION_AGENT = {
    keepAlive: true,
    keepAliveMsecs: 4096,
    maxSockets: Number.MAX_SAFE_INTEGER,
    maxFreeSockets: 256
};
const HttpAgent = new Http.Agent(OPTION_AGENT);
const HttpsAgent = new Https.Agent(OPTION_AGENT);

class ApiRequest {

    /**
     * request data from api server
     *
     * @param config
     * @param {string} config.apiHost
     * @param {string} [config.protocol=http] the protocol that request api server.
     * @param {number} [config.dnsCacheTime=10] the time for dns cache, default 10 seconds, do not use dns cache if set 0.
     * @param {number} [config.timeout=10] timeout for each api request, default 10 seconds.
     * @param {boolean} [config.compress=false] whether accept encoding from api server, and only gzip and deflate support.
     * @param {string} [config.headers='Cookie,User-Agent,Referrer'] the header you want to proxy to api server from original request.
     */
    constructor (config) {
        Assert(!!config.apiHost, 'apiHost must exists');
        this.config = {
            host: config.apiHost,
            family: undefined
        };
        this.timeout = (config.timeout || 10) * 1000;

        if (config.protocol === 'https') {
            this.client = Https;
            this.agent = HttpsAgent;
        } else {
            this.client = Http;
            this.agent = HttpAgent;
        }
        this.headers = {
            Accept: '*/*',
            Host: config.apiHost,
            'User-Agent': 'KoaApiCombo/1.0'
        };

        if (config.compress) {
            this.headers['Accept-Encoding'] = 'gzip,deflate';
        }
        this.proxyHeaders = (config.headers || 'Cookie,User-Agent,Referrer').split(',');

        if (config.dnsCacheTime !== 0) {
            this._lookup(config.apiHost, (config.dnsCacheTime || 10) * 1000);
        }
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
        let headers = Object.assign({}, this.headers);

        this.proxyHeaders.forEach(function (key) {
            let val = ctx.get(key);
            if (val) {
                headers[key] = val;
            }
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
                const data = [];

                res.on('data', function (chunk) {
                    data.push(chunk);
                });

                res.on('end', function () {
                    let body = '';
                    switch (res.headers['content-encoding']) {
                        case 'gzip':
                        case 'x-gzip':
                            body = Zlib.gunzipSync(Buffer.concat(data), OPTION_ZLIB);
                            break;
                        case 'deflate':
                        case 'x-deflate':
                            if ((data[0] & 0x0F) === 0x08) {
                                body = Zlib.inflateSync(Buffer.concat(data));
                            } else {
                                body = Zlib.inflateRawSync(Buffer.concat(data));
                            }
                            break;
                        default:
                            body = Buffer.concat(data).toString();
                    }

                    const statusCode = res.statusCode;
                    if (statusCode < 200 || statusCode >= 300) {
                        return reject({
                            status: statusCode,
                            body
                        });
                    }
                    resolve(body);
                });

                res.on('error', reject);
            });

            req.setTimeout(this.timeout, req.abort.bind(req));
            req.on('error', reject);
            req.end();
        });
    }
}

module.exports = ApiRequest;
