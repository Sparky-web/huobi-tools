import axios_1 from "axios";
import moment from "moment";
import CryptoJS from "crypto-js";
import HmacSHA256 from "crypto-js/hmac-sha256.js";
import HttpsProxyAgent from 'https-proxy-agent'


const DEFAULT_HEADERS = {
    'Content-Type': 'application/json;charset=utf-8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
};
var STATUS;
(function (STATUS) {
    STATUS["OK"] = "ok";
    STATUS["ERROR"] = "error";
})(STATUS || (STATUS = {}));

class HuobiRestAPI {
    constructor({accessKey, secretKey, proxy = false, hostname = 'api.huobi.pro', timeout = 5000}) {
        if (!accessKey || !secretKey) {
            throw 'Params Missing: accessKey or secretKey';
        }
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.hostname = hostname;
        this.protocol = 'https';
        this.proxy = proxy;
        this.httpsConfig = {
            timeout,
            headers: DEFAULT_HEADERS
        };
    }

    get host() {
        return `${this.protocol}://${this.hostname}`;
    }

    get(path, params) {
        return this.request('GET', path, params);
    }

    post(path, params) {
        return this.request('POST', path, params);
    }

    request(method, path, params) {
        if (method !== 'GET' && method !== 'POST') {
            throw 'method only be GET or POST';
        }
        path = this.foramtPath(path);
        const {paramsStr, originalParams} = this.signParams({
            path,
            method,
            params
        });
        if (method === 'GET') {
            return this.fetch(`${path}?${paramsStr}`, {
                method
            });
        }
        return this.fetch(`${path}?${paramsStr}`, {
            method,
            data: originalParams
        });
    }

    signParams({method, path, params}) {
        if (!path.startsWith('/')) {
            throw 'path must starts with \/';
        }
        const needSignature = !path.startsWith('/market');
        let originalParams;
        if (needSignature) {
            originalParams = Object.assign({
                AccessKeyId: this.accessKey,
                SignatureMethod: 'HmacSHA256',
                SignatureVersion: '2',
                Timestamp: moment.utc().format('YYYY-MM-DDTHH:mm:ss')
            }, params);
        } else {
            originalParams = Object.assign({}, params);
        }
        const paramsArr = [];
        for (const item in originalParams) {
            paramsArr.push(`${item}=${encodeURIComponent(originalParams[item])}`);
        }
        const pStr = paramsArr.sort().join('&');
        if (!needSignature) {
            return {
                originalParams,
                signature: '',
                paramsStr: pStr
            };
        }
        const meta = [method, this.hostname, path, pStr].join('\n');
        const hash = HmacSHA256(meta, this.secretKey);
        const signature = encodeURIComponent(CryptoJS.enc.Base64.stringify(hash));
        return {
            signature,
            originalParams,
            paramsStr: `${pStr}&Signature=${signature}`
        };
    }

    foramtPath(path) {
        path = path.trim();
        if (!path.startsWith('/')) {
            path = `/${path}`;
        }
        if (path.endsWith('/')) {
            path = path.substring(0, path.length - 1);
        }
        return path;
    }

    fetch(path, options) {
        const url = `${this.host}${path}`;
        return axios_1.default({
            url, ...options, ...this.httpsConfig,
            httpsAgent: this.proxy ? new HttpsProxyAgent(this.proxy) : undefined,
            httpAgent: this.proxy ? new HttpsProxyAgent(this.proxy) : undefined
        }).then((res) => {
            if (res.status !== 200) {
                throw res;
            }
            return res.data;
        }).then((data) => {
            if ((data.code !== 200 && !data.status) || data.status !== "ok") {
                throw new Error(`${data["err-code"]}: ${data["err-msg"]}`);
            }
            return data;
        });
    }
}

export default HuobiRestAPI
