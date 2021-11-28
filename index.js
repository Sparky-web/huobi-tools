import {withdraw, checkBalances} from "./modules/client.js"

let account = {
    accessKey: "800eb6a4-346e12c5-qv2d5ctgbn-08926",
    secretKey: "1fc13797-67c1a030-1ab73c00-a142a",
    coin: "eth",
    amount: 0.001,
    type: "trc-20",
    address: "0xf958E9006e9bB937c556933B2D8281DDd5C40450"
}

let accounts = [account]

console.log(await checkBalances(accounts))
console.log(await withdraw(accounts))


