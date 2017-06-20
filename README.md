# node-api-combo
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
```

## Install

```sh
npm install koa-api-combo --save
```

## Middleware

### `Combo(path, config)`

* `path` is the route string. And should be exactly equal to `ctx.path`.
* `config` is an object configuration for api request below.

### `ApiRequest(config)`

* @param {string} config.apiHost
* @param {string} [config.protocol=http] the protocol that request api server
* @param {number} [config.dnsCacheTime=10] the time for dns cache, default 10 seconds, do not use dns cache if set 0
* @param {number} [config.timeout=10] timeout for each api request, default 10 seconds
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