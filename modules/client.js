import HuobiRestAPI from "./huobi.js";

function parseProxy(str) {
    const parsed = new URL(str)
    return {
        protocol: parsed.protocol.substr(0, parsed.protocol.length - 1),
        host: parsed.hostname,
        port: parsed.port,
        auth: {
            username: parsed.username,
            password: parsed.password
        }
    }
}

function getHuobiApiClient(account) {
    return new HuobiRestAPI({
        accessKey: account.accessKey, secretKey: account.secretKey,
        proxy: account.proxy ? parseProxy(account.proxy) : undefined,
    });
}

export async function withdraw(accounts) {
    const newAccounts = []

    for (let account of accounts) {
        let status
        try {
            const huobi = getHuobiApiClient(account)

            const data = await huobi.post("/v1/dw/withdraw/api/create", {
                currency: account.coin,
                address: account.address,
                chain: account.chain,
                amount: account.amount
            })

            console.log(`Запрос на вывод ${account.amount} ${account.coin} создан.\n${data}`)

            status = "ok"
        } catch (e) {
            console.error(`Ошибка при выводе ${account.amount} ${account.coin} на аккаунте ${account.accessKey}. ${e.message || e}`)
            status = "error"
        }

        newAccounts.push({...account, status})
    }

    return newAccounts
}

export async function checkBalances(accounts) {
    const allBalances = []

    for(let account of accounts) {
        try {
            const huobi = getHuobiApiClient(account)

            const {data} = await huobi.get("/v1/account/accounts")
            const spotId = data.find(e => e.type === "spot").id

            const {data: {list: balances}} = await huobi.get(`/v1/account/accounts/${spotId}/balance`)
            const {balance: currencyBalance} = balances.find(e => e.currency === account.coin)

            console.log(`На баллансе аккаунта ${account.accessKey} ${currencyBalance} ${account.coin}`)
            allBalances.push({
                ...account,
                balance: +currencyBalance
            })

        } catch (e) {
            console.error(`Ошибка при проверке балланса ${account.coin} на аккаунте ${account.accessKey}. ${e.message || e}`)
        }
    }

    return allBalances
}

export default {withdraw, checkBalances}