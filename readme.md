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

#### PunkTransferProxy

https://etherscan.io/address/0x99AEECF3717ec6B369d847e3D62d14e14251e4d4#code


## Audit
N/A

## Technical Information
Using OpenZeppelin contracts.
- Upgradable ERC20 transfer proxy smart contracts.
- Upgradable ERC721/1155 transfer proxy smart contracts.
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
hardhat run deploy/001_deploy_ERC20Incentive.ts
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


## Algorithms

Main function in the Exchange is matchOrders. It takes two orders (left and right), tries to match them and then fills if there is a match.

Logically, whole process can be divided into stages:

- order validation (check order parameters are valid and caller is authorized to execute the order)
- asset matching (check if assets from left and right order match, extract matching assets)
- calculating fill (finding out what exact values should be filled. orders can be matched partly if one of the sides doesn't want to fill other order fully)
- order execution (execute transfers, save fill of the orders if needed)

### Domain model

#### Order:

- `address` maker
- `Asset` leftAsset
- `address` taker (can be zero address)
- `Asset` rightAsset
- `uint` salt - random number to distinguish different maker orders
- `uint` start - Order can't be matched before this date (optional)
- `uint` end - Order can't be matched after this date (optional)
- `bytes4` dataType - type of data, usually hash of some string, e.g.: "0xffffffff"
- `bytes` data - generic data, can be anything, extendable part of the order

#### Order validation

- check start/end date of the orders
- check if taker of the order is blank or taker = order.taker
- check if order is signed by its maker or maker of the order is executing the transaction
- if maker of the order is a contract, then ERC-1271 check is performed

Only off-chain orders are supported

#### Asset matching

Purpose of this is to validate that **make asset** of the **left** order matches **take asset** from the **right** order and vice versa.
New types of assets can be added without smart contract upgrade. This is done using custom IAssetMatcher.

#### Order execution

Order execution is done by TransferManager

#### Royalties

Royalties percentage and receiver is extracted from the RoyaltiesRegistry and can be of many forms, GhostMarketRoyalties, RaribleRoyalties, EIP2981, or others.

#### Fees

`protocolFee` set currently to 2%

##### Fees calculation, fee side

To take a fee we need to calculate, what side of the deal can be used as money.
There is a simple algorithm to do it:

- if Base Currency is from any side of the deal, it's used
- if not, then if ERC-20 is in the deal, it's used
- if not, then if ERC-1155 is in the deal, it's used
- otherwise, fee is not taken (for example, two ERC-721 are involved in the deal)

When we established, what part of the deal can be treated as money, then we can establish, that

- buyer is side of the deal who owns money
- seller is other side of the deal

Then total amount of the asset (money side) should be calculated

- protocol fee is added on top of the filled amount
- origin fee of the buyer's order is added on top too

If buyer is using ERC-20 token for payment, then he must approve at least this calculated amount of tokens.

If buyer is using Base Currency, then he must send this calculated amount of Base Currency with the tx.

More on fee calculation can be found here src/GhostMarketTransferManager.sol
