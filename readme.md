# GhostMarket Exchange smart contracts

[![codecov](https://codecov.io/github/OnBlockIO/evm-trading-contracts/branch/main/graph/badge.svg?token=GHZYA9CM2E)](https://codecov.io/github/OnBlockIO/evm-trading-contracts)

## Deployed Contracts on BSC:

#### ERC20TransferProxy

https://bscscan.com/address/0x2617Ad006cC4D4ed52D3Ed688316feF5b4658845#code

#### TransferProxy

https://bscscan.com/address/0x7f61f22C7962F733853C8902Ccf55BC78F379431#code

#### RoyaltiesRegistry Proxy

https://bscscan.com/address/0x1073e1d5977002d5db4F9E776482E8BF113C745c#code

#### AssetMatcherCollection

https://bscscan.com/address/0xE6bbAfB291DD683E85520785CC3502CA9ce581A5#code

#### ExchangeV2 Proxy

https://bscscan.com/address/0x388171F81FC91EfC7338E07E52555a90c7D87972#code


## Deployed Contracts on Avalanche:

#### ERC20TransferProxy

https://snowtrace.io/address/0x3417E77e81Cf31bb210c2364883EB83E5077f0Dd#code

#### TransferProxy

https://snowtrace.io/address/0x3d7e2A3ecb2AE2a516465c611DFf813d7B9297f8#code

#### RoyaltiesRegistry Proxy

https://snowtrace.io/address/0x913FbdC42a77edb0aEFFCEEAe00240C368d9B6b1#code

#### AssetMatcherCollection

https://snowtrace.io/address/0xF0ef7f0E9B95738924B9D92013FEAB39aa3Ba019#code

#### ExchangeV2 Proxy

https://snowtrace.io/address/0xEb4ABA7aeba732Fc2FC92a673585d950cCFC1de0#code


## Deployed Contracts on Polygon:

#### ERC20TransferProxy

https://polygonscan.com/address/0x44C5CE28c29934B71A2a0447745d551DfC7B5133#code

#### TransferProxy

https://polygonscan.com/address/0x26D583e2CDa958b13CC319FAd124aa729f8A196e#code

#### RoyaltiesRegistry Proxy

https://polygonscan.com/address/0x7eD7Bff3bEfa9cEDf6A6d4768F4051fEd7fC1975#code

#### AssetMatcherCollection

https://polygonscan.com/address/0xa100dCC8ce4328cDA39d29bcA537BBA15012d242#code

#### ExchangeV2 Proxy

https://polygonscan.com/address/0x3B48563237C32a1f886FD19DB6F5AFFD23855E2a#code


## Deployed Contracts on Ethereum:

#### ERC20TransferProxy

https://etherscan.io/address/0x153909fB5232c72B5E613aae4898291b014785a1#code

#### TransferProxy

https://etherscan.io/address/0x1bb6C21e6adB8757F46e77A7F4c5Ad9118f4A04d#code

#### RoyaltiesRegistry Proxy

https://etherscan.io/address/0x3dA0bD10dfD98E96E04fbAa8e0512b2c413b096A#code

#### AssetMatcherCollection

https://etherscan.io/address/0x49CaC1f0564Ed70a30C2454F653a3A1058D6A9bA#code

#### ExchangeV2 Proxy

https://etherscan.io/address/0xfB2F452639cBB0850B46b20D24DE7b0a9cCb665f#code


## Audit
N/A

## Technical Information
Using OpenZeppelin contracts.
- ERC20 transfer proxy smart contracts.
- ERC721/1155 transfer proxy smart contracts.
- ERC721/1155 Lazy Mint transfer proxy smart contracts.
- Upgradable royalties registry smart contracts.
- Upgradable asset matcher collection smart contracts.
- Upgradable exchange smart contracts.

### Compiling contracts
```
hardhat compile
```

### Deploying Proxy
Using hardhat to deploy proxy contracts

#### locally
```
hardhat run deploy/001_deploy_transferProxy.ts
hardhat run deploy/001_deploy_erc20_transferProxy.ts
hardhat run deploy/001_deploy_lazyMint_transferProxies.ts
hardhat run deploy/001_deploy_royalties_registry.ts
hardhat run deploy/001_deploy_custom_matcher.ts
hardhat run deploy/001_deploy_exchange_proxy.ts
```

#### to network
```
hardhat run --network <network_name> deploy/<deploy_script>.ts
```
For deployment private keys must be saved into

```
.secrets.json
```

secrets.json structure:

```
{
    "ETH_NODE_URI": "key",
    "TESTNET_PRIVATE_KEY": ["key1","key2","key3","key4"],
    "MAINNET_PRIVATE_KEY": ["key1","key2","key3","key4"],
    "ETHERSCAN_API_KEY": "key"
}
```

## Testing
tests can be run with:

```
hardhat test
```

```
hardhat test <network_name>
```

## Coverage
coverage can be run with:

```
hardhat coverage
```

```
hardhat coverage <network_name>
```

## Verifying contracts
```
hardhat verify --network <network_name> <0x_contract_address>
```