# monero-wallet

This is my first try with [monero-javascript](https://github.com/monero-ecosystem/monero-javascript).

## Requirements

One first needs to run a daemon and an monero-wallet-rpc:

```
monerod --rpc-bind-ip 127.0.0.1 --rpc-bind-port 18081 --rpc-login superuser:abctesting123 --rpc-access-control-origins http://localhost:8080

monero-wallet-rpc --rpc-login user1:test1 --rpc-access-control-origins http://localhost:8080 --rpc-bind-port 18084 --wallet-dir ~/Monero/wallets/test-main --daemon-login superuser:abctesting123
```

Then `yarn start`. The result should appear in the console.
