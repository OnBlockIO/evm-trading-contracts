require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-ganache");
require("@nomiclabs/hardhat-web3");
require('hardhat-abi-exporter');
require("@nomiclabs/hardhat-etherscan");
require('hardhat-contract-sizer');


const {
  ALCHEMY_PROJECT_ID,
  BSC_TESTNET_PRIVATE_KEY,
  BSCSCAN_API_KEY,
} = require('./.secrets.json');

task("accounts", "Prints accounts", async (_, { web3 }) => {

  console.log(await web3.eth.getAccounts());

});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",    // Fetch exact version from solc-bin (default: truffle's version)
    settings: {          // See the solidity docs for advice about optimization and evmVersion
      optimizer: {
        enabled: true,
        runs: 250,
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  networks: {
    hardhat: {
      //gasPrice: 0,
      //gas: 1
    },
    mainnet: {
      url: 'https://bsc-dataseed1.binance.org:443',
      accounts: BSC_TESTNET_PRIVATE_KEY
    },
    bsctestnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts: BSC_TESTNET_PRIVATE_KEY
    },
    rinkeby: {
      url: 'https://eth-rinkeby.alchemyapi.io/v2/' + ALCHEMY_PROJECT_ID,
      //url: "https://rinkeby.infura.io/v3/" + INFURA_PROJECT_ID,
      accounts: BSC_TESTNET_PRIVATE_KEY
      
    },
  },
  etherscan: {
    apiKey: BSCSCAN_API_KEY
  },
  mocha: {
    timeout: 200000
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
  }
};