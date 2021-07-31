require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-ganache");
require("@nomiclabs/hardhat-web3");
require('hardhat-abi-exporter');
require("@nomiclabs/hardhat-etherscan");

const {
  ALCHEMY_PROJECT_ID,
  INFURA_PROJECT_ID_CYX,
  MAINNET_PRIVATE_KEYS,
  RINKEBY_PRIVATE_KEYS,
  ROPSTEN_PRIVATE_KEYS,
  ETHERSCAN_API_KEY
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
        runs: 500
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
    },
    mainnet: {
      url: 'https://eth-mainnet.alchemyapi.io/v2/' + ALCHEMY_PROJECT_ID,
      //url: "https://mainnet.infura.io/v3/" + INFURA_PROJECT_ID_CYX,
      accounts: MAINNET_PRIVATE_KEYS
    },
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/' + ALCHEMY_PROJECT_ID,
      //url: "https://ropsten.infura.io/v3/" + INFURA_PROJECT_ID_CYX,
      accounts: ROPSTEN_PRIVATE_KEYS
      
    },
    rinkeby: {
      url: 'https://eth-rinkeby.alchemyapi.io/v2/' + ALCHEMY_PROJECT_ID,
      //url: "https://rinkeby.infura.io/v3/" + INFURA_PROJECT_ID_CYX,
      accounts: RINKEBY_PRIVATE_KEYS  
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  mocha: {
    timeout: 200000
  }
};