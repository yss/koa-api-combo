# koa-api-combo
proxy multiple http or https requests, and response the result array by combine all the result.

## Usage

```js
const Combo = require('koa-api-combo');

// GET /combo?urls=encodeURIComponent('/x,/xx?xxx,/xxx')&...
app.use(Combo('/combo', { apiHost: 'a.com' });
// equals to
// GET /x?...
// GET /xx?xxx&...
// GET /xxx?...

// GET /combo?urls=encodeURIComponent('/x,/xx?xxx,/xxx')&...
// GET /combo/ignore?urls=encodeURIComponent('/x,/xx?xxx,/xxx')&...
// the request result data will be set to null if the request is error
// and the result should be like [null] [null, {"a":1}] ...
app.use(Combo.withIgnoreError('/combo', { apiHost: 'a.com' }));
```

## Install

```sh
npm install koa-api-combo --save
```

## Middleware

### `Combo(path, comboConfig, apiRequestConfig)`

* @param {string} path is the route string. And should be exactly equal to `ctx.path`
* @param {Object} apiRequestConfig the same as ApiRequest
* @param {Object} comboConfig
* @param {boolean} [comboConfig.supportIgnoreError] will use null instead the response data if request url error,
*       and need request by append `/ignore` to the `path` parameter if set to true
* @param {Function} [comboConfig.isValidUrl] for filter possible illegal url if needed,
        and response 400 with parameters error

### `ApiRequest(config)`

* @param {string} config.apiHost
* @param {number} [config.port]
* @param {string} [config.protocol=http] the protocol that request api server
* @param {number} [config.dnsCacheTime=10] the time for dns cache, default 10 seconds, do not use dns cache if set 0
* @param {number} [config.timeout=7] timeout for each api request, default 7 seconds
* @param {boolean} [config.compress=false] whether accept encoding from api server, and only gzip and deflate support.
* @param {string} [config.headers='Cookie,User-Agent,Referrer'] the header you want to send to api server

### Query

The key of query is `urls`.

The value is the url array separate from `,`, and should encode it by use `encodeURIComponent`.

Each url can have `?` and `&`, and will append with the querystring from `ctx.querystring` except `urls`.

So this means parameters are shared by each url if you set other parameter but `urls` to current request.

Some Example:

```html
GET /combo?urls=/a,/b&p=1 # urls=encodeURIComponent('/a,/b')
// equivalent to
// /a?p=1 and /b?p=1

GET /combo?h=2&urls=/a?c=1,/b?p=1&p=1 # urls=encodeURIComponent('/a?c=1,/b?p=1')
// equivalent to
// /a?c=1&h=2&p=1 and /b?p=1&h=2&p=1
```

Note::: it just append to the url for the same query! And query from url is first.

## Test

`npm test`