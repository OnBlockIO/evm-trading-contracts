# GhostMarket Exchange smart contracts

## Deployed Contracts:

#### ERC20TransferProxy

https://etherscan.io/address/0x153909fB5232c72B5E613aae4898291b014785a1/contracts
https://bscscan.com/address/0x2617Ad006cC4D4ed52D3Ed688316feF5b4658845#code
https://snowtrace.io/address/0x3417E77e81Cf31bb210c2364883EB83E5077f0Dd#code
https://polygonscan.com/address/0x44C5CE28c29934B71A2a0447745d551DfC7B5133#code

#### TransferProxy

https://etherscan.io/address/0x1bb6C21e6adB8757F46e77A7F4c5Ad9118f4A04d/contracts
https://bscscan.com/address/0x7f61f22C7962F733853C8902Ccf55BC78F379431#code
https://snowtrace.io/address/0x3d7e2A3ecb2AE2a516465c611DFf813d7B9297f8#code
https://polygonscan.com/address/0x26D583e2CDa958b13CC319FAd124aa729f8A196e#code

#### RoyaltiesRegistry Proxy

https://etherscan.io/address/0x3dA0bD10dfD98E96E04fbAa8e0512b2c413b096A/contracts
https://bscscan.com/address/0x1073e1d5977002d5db4F9E776482E8BF113C745c#code
https://snowtrace.io/address/0x913FbdC42a77edb0aEFFCEEAe00240C368d9B6b1#code
https://polygonscan.com/address/0x7eD7Bff3bEfa9cEDf6A6d4768F4051fEd7fC1975#code

#### RoyaltiesRegistry Implementation

https://etherscan.io/address/0x88F166Ac7462D1745A690f51cBe04AB5f73D406D/contracts
https://bscscan.com/address/0x875957cA6c9038D7Da37CBFc0FfcF7eb18d85d6A#code
https://snowtrace.io/address/0x265ac81F659F1DA2F64c2620D826c6f3E63B8C43#code
https://polygonscan.com/address/0xF5dD8AB614EB0869A2035160B947c9E733cb51ea#code

#### AssetMatcherCollection

https://etherscan.io/address/0x49CaC1f0564Ed70a30C2454F653a3A1058D6A9bA/contracts
https://bscscan.com/address/0xE6bbAfB291DD683E85520785CC3502CA9ce581A5#code
https://snowtrace.io/address/0xF0ef7f0E9B95738924B9D92013FEAB39aa3Ba019#code
https://polygonscan.com/address/0xa100dCC8ce4328cDA39d29bcA537BBA15012d242#code

#### PunkTransferProxy

https://etherscan.io/address/0x99AEECF3717ec6B369d847e3D62d14e14251e4d4/contracts

#### ExchangeV2 Proxy

https://etherscan.io/address/0xfB2F452639cBB0850B46b20D24DE7b0a9cCb665f/contracts
https://bscscan.com/address/0x388171F81FC91EfC7338E07E52555a90c7D87972#code
https://snowtrace.io/address/0xEb4ABA7aeba732Fc2FC92a673585d950cCFC1de0#code
https://polygonscan.com/address/0x3B48563237C32a1f886FD19DB6F5AFFD23855E2a#code

#### ExchangeV2 Implementation

https://etherscan.io/address/0xdE279ADc5D154Cb997C79C7a6e8b970Bca2d0ba5/contracts
https://bscscan.com/address/0x1D9f90960D3bfD303c365Cf8Ff2069b5030cB08A#code
https://snowtrace.io/address/0xE0A384142283C1d1656fEC0Fd592034f1cCC6Bd5#code
https://polygonscan.com/address/0x71e70353b41127dADeA7E3C60aa32CcaddF89098#code

#### ProxyAdmin

https://etherscan.io/address/0x596a6fFC1525193E49C71476BAa8a9D071A8a2a3/contracts
https://bscscan.com/address/0x60d105E8144eCf42D10185420B835D01842Dd113#code
https://snowtrace.io/address/0x1a4A4c1fa352DC42481036b62117a64346478dA6#code
https://polygonscan.com/address/0xF57e3B24Ee25fb6886A0FB475adEE99B5fCD88Bd#code

#### TransparentUpgradeableProxy

https://etherscan.io/address/0x1bb6C21e6adB8757F46e77A7F4c5Ad9118f4A04d/contracts
https://bscscan.com/address/0x1073e1d5977002d5db4F9E776482E8BF113C745c#code
https://snowtrace.io/address/0x913fbdc42a77edb0aeffceeae00240c368d9b6b1#code
https://polygonscan.com/address/0x7ed7bff3befa9cedf6a6d4768f4051fed7fc1975#code

## Architecture

Smart contracts are built using openzeppelin's upgradeable smart contracts library.

Tests are provided in the test folder.

Functionality is divided into parts (each responsible for the part of algorithm).

GhostMarket Exchange is a smart contract decentralized exchange.

### Compiling contracts
```
hardhat compile
```
### Deploying

Using hardhat-deploy plugin to deploy proxy contracts

Contracts can be deployed with the following commands

#### locally

```
hardhat deploy

```

#### to network
```
hardhat --network <network_name> deploy
```

deploy individually to testnet:

```
hardhat --network testnet deploy
```

### Troubleshooting deploy errors

if contracts can not be deployed because of errors, try to remove the cache && artifacts && .openzeppelin && deployments folders

`rm -rf cache/* && rm -rf artifacts/* && rm -rf .openzeppelin/* && rm -rf deployments/*`

## Verifying contracts

https://github.com/wighawag/hardhat-deploy#4-hardhat-etherscan-verify

```
hardhat --network <network> etherscan-verify
```

## Tests

tests can be run with:

```
hardhat test
```

### running individual tests

choose a test file
```
hardhat test test/<testname>.js
```

with the .only flag individual test can be run
```
it.only("should run this test") async function () {
  ...
}
```

Chain ID needs to be set for ganache-cli:
ganache-cli --chainId 1

if the chain id does not match `block.chainid` the `src/OrderValidator.sol validate()` function will revert.

ganache-cli sets the chain id to 1337 as default, that somehow does not match the `block.chainid`
from `@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol`


## Algorithms

Main function in the Exchange is matchOrders. It takes two orders (left and right), tries to match them and then fills if there is a match.

Logically, whole process can be divided into stages:

- order validation (check order parameters are valid and caller is authorized to execute the order)
- asset mathing (check if assets from left and right order match, extract matching assets)
- calculating fill (finding out what exact values should be filled. orders can be matched partly if one of the sides doesn't want to fill other order fully)
- order execution (execute transfers, save fill of the orders if needed)

### Domain model

#### Order:

- `address` maker
- `Asset` leftAsset (see [LibAsset](src/lib/LibAsset.md))
- `address` taker (can be zero address)
- `Asset` rightAsset (see [LibAsset](src/lib/LibAsset.md))
- `uint` salt - random number to distinguish different maker's Orders
- `uint` start - Order can't be matched before this date (optional)
- `uint` end - Order can't be matched after this date (optional)
- `bytes4` dataType - type of data, usually hash of some string, e.g.: "0xffffffff"
(see more [here](./src/LibOrderData.md))
- `bytes` data - generic data, can be anything, extendable part of the order (see more [here](./src/LibOrderData.md))

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
