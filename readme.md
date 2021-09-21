# GhostMarket Exchange smart contracts

## Deployed Contracts:

#### ERC20TransferProxy
https://bscscan.com/address/0x2617Ad006cC4D4ed52D3Ed688316feF5b4658845

#### TransferProxy
https://bscscan.com/address/0x7f61f22C7962F733853C8902Ccf55BC78F379431

#### ExchangeV2
https://bscscan.com/address/0xc881b96b13da75ccbd35dad5443238ae982e479b

#### ProxyAdmin
https://bscscan.com/address/0xba2e051289654d7d5846d8537bcd69cf8230a0e8

#### TransparentUpgradeableProxy
https://bscscan.com/address/0xaf42413b4094bee8e7b188b210ca2731815b0cf6

## Architecture

Smart contracts are built using openzeppelin's upgradeable smart contracts library.

Tests are provided in the test folder.

Functionality is divided into parts (each responsible for the part of algorithm).

GhostMarket Exchange is a smart contract decentralized exchange on the BSC blockchain.

## Tests

Chain ID needs to be set for ganache-cli:
ganache-cli --chainId 1

if the chain id does not match `block.chainid` the `contracts/OrderValidator.sol validate()` function will revert.

ganache-cli sets the chain id to 1337 as default, that somehow does not match the `block.chainid` 
from `@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol`

Test can be run with 



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
- `Asset` leftAsset (see [LibAsset](contracts/lib/LibAsset.md))
- `address` taker (can be zero address)
- `Asset` rightAsset (see [LibAsset](contracts/lib/LibAsset.md))
- `uint` salt - random number to distinguish different maker's Orders
- `uint` start - Order can't be matched before this date (optional)
- `uint` end - Order can't be matched after this date (optional)
- `bytes4` dataType - type of data, usually hash of some string, e.g.: "0xffffffff", "NFT_TRANSFER_FROM_CONTRACT" (see more [here](./contracts/LibOrderData.md))
- `bytes` data - generic data, can be anything, extendable part of the order (see more [here](./contracts/LibOrderData.md))

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

Royalties percentage and receiver is extracted from GhostmarketERC1155.sol and GhostmarketERC721.sol contracts
calculated from the auctions closing price and sent to the receiver.

#### Fees

`protocolFee` set currently to 2%
##### Fees calculation, fee side

To take a fee we need to calculate, what side of the deal can be used as money.
There is a simple algorithm to do it:
- if ETH is from any side of the deal, it's used
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

If buyer is using ETH, then he must send this calculated amount of ETH with the tx.

More on fee calculation can be found here contracts/GhostMarketTransferManager.sol