//global.artifacts = artifacts;
global.web3 = web3;
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const { Order, Asset, Types } = require("./order_for_truffle_exec.js")
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, enc, id } = require("./assets_for_truffle_exec.js");
const HDWalletProvider = require('@truffle/hdwallet-provider');
const {
  INFURA_PROJECT_ID,
  LOCAL_TEST_MNEMONIC,
  RINKEBY_PRIVATE_KEYS,
  ROPSTEN_PRIVATE_KEYS
 } = require('../.secrets.json');

async function main() {
  let provider = new HDWalletProvider({
    mnemonic: "spell found relax dose coffee rotate suspect tree imitate violin note throw",
    providerOrUrl: "http://127.0.0.1:8545",
    numberOfAddresses: 9,
    derivationPath: "m/44'/60'/0'/0"
  })
  //console.log(provider);

  const ZERO = "0x0000000000000000000000000000000000000000"

  let testing = await ExchangeV2.deployed()
  console.log(await testing.getChainId());
  
  let t1 = await TestERC20.new();

  let accounts = web3.eth.getAccounts()

  let left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, web3.eth.abi.encodeParameter("address", t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

  let right = Order(accounts[1], Asset(ERC20, web3.eth.abi.encodeParameter("address", t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");


  let signatureRight = await sign(right, accounts[1], testing.address);


  testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
}

// For truffle exec
module.exports = function (callback) {
  main().then(() => callback()).catch(err => callback(err))
};

async function sign(order, account, verifyingContract) {
  const EIP712 = require("./EIP712");
  const chainId = Number(await web3.eth.getChainId());
  console.log("chainId: ", chainId)
  const data = EIP712.createTypeData({
    name: "GhostMarket",
    version: "2",
    chainId,
    verifyingContract
  }, 'Order', order, Types);
  return (await EIP712.signTypedData(web3, account, data)).sig;
}