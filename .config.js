const ethereum_mainnet = {
  fees: 200,
  transferProxy: '0x1bb6C21e6adB8757F46e77A7F4c5Ad9118f4A04d',
  erc20TransferProxy: '0x153909fB5232c72B5E613aae4898291b014785a1',
  erc721LazyMintTransferProxy: '',
  erc1155LazyMintTransferProxy: '',
  royalties_proxy: '0x3dA0bD10dfD98E96E04fbAa8e0512b2c413b096A',
  exchange_proxy: '0xfB2F452639cBB0850B46b20D24DE7b0a9cCb665f',
  exchange_wrapper_proxy: '',
  customMatcher: '0x88F166Ac7462D1745A690f51cBe04AB5f73D406D',
  rarible: '0x7f19564C35c681099c0c857a7141836Cf7EDaa53',
  looksRare: '0x59728544B08AB483533076417FbBB2fD0B17CE3a',
  seaport: '0x00000000006c3852cbEf3e08E8dF289169EdE581',
  sudoswap: '0x2B2e8cDA09bBA9660dCA5cB6233787738Ad68329',
  wyvernExchange: '0x7f268357A8c2552623316e2562D90e642bB538E5',
  x2y2: '0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3',
};

const ethereum_testnet = {
  fees: 200,
  transferProxy: '0x7aa199E2D5cFf1E6275A33c8dCE3c6085E393781',
  erc20TransferProxy: '0x34A40153C91a411b0a94eEa4506733e59d523495',
  erc721LazyMintTransferProxy: '',
  erc1155LazyMintTransferProxy: '',
  royalties_proxy: '0xca1284B5EEb97c31cc693c4b182C8E1075Dc57f9',
  exchange_proxy: '0xfB2F452639cBB0850B46b20D24DE7b0a9cCb665f',
  exchange_wrapper_proxy: '',
  customMatcher: '',
};

const avalanche_mainnet = {
  fees: 200,
  transferProxy: '0x3d7e2A3ecb2AE2a516465c611DFf813d7B9297f8',
  erc20TransferProxy: '0x3417E77e81Cf31bb210c2364883EB83E5077f0Dd',
  erc721LazyMintTransferProxy: '',
  erc1155LazyMintTransferProxy: '',
  royalties_proxy: '0x913FbdC42a77edb0aEFFCEEAe00240C368d9B6b1',
  exchange_proxy: '0xEb4ABA7aeba732Fc2FC92a673585d950cCFC1de0',
  exchange_wrapper_proxy: '',
  customMatcher: '0x265ac81F659F1DA2F64c2620D826c6f3E63B8C43',
};

const avalanche_testnet = {
  fees: 200,
  transferProxy: '0x05Ebd261CBd932eaA8e7Dc6C858AF189c77BcdB8',
  erc20TransferProxy: '0xF23121871c3117FFAF860E97A854162900Bd4eaf',
  erc721LazyMintTransferProxy: '',
  erc1155LazyMintTransferProxy: '',
  royalties_proxy: '0x92bf637c4FadEC1b698002cbA1583850e6EC97d3',
  exchange_proxy: '0x32fD06f88AFc3ce26bbD1cD9FA97dd27BD0826Cd',
  exchange_wrapper_proxy: '',
  customMatcher: '',
};

const polygon_mainnet = {
  fees: 200,
  transferProxy: '0x26D583e2CDa958b13CC319FAd124aa729f8A196e',
  erc20TransferProxy: '0x44C5CE28c29934B71A2a0447745d551DfC7B5133',
  erc721LazyMintTransferProxy: '',
  erc1155LazyMintTransferProxy: '',
  royalties_proxy: '0x7eD7Bff3bEfa9cEDf6A6d4768F4051fEd7fC1975',
  exchange_wrapper_proxy: '0x3B48563237C32a1f886FD19DB6F5AFFD23855E2a',
  customMatcher: '0xF5dD8AB614EB0869A2035160B947c9E733cb51ea',
};

const polygon_testnet = {
  fees: 200,
  transferProxy: '0x42c81EF5CCd03242c642164037d588557563F085',
  erc20TransferProxy: '0xb24BB6B0d477eA8c0F1eEe4c00b1281B3eF25397',
  erc721LazyMintTransferProxy: '',
  erc1155LazyMintTransferProxy: '',
  royalties_proxy: '0x7E20461EcC3B27586EFEa0e3dB9E80bfbE55B9eB',
  exchange_proxy: '0x5B2e6bEE51bC4Cc389503DD186bA66d98405320F',
  exchange_wrapper_proxy: '',
  customMatcher: '',
};

const bsc_mainnet = {
  fees: 200,
  transferProxy: '0x7f61f22C7962F733853C8902Ccf55BC78F379431',
  erc20TransferProxy: '0x2617Ad006cC4D4ed52D3Ed688316feF5b4658845',
  erc721LazyMintTransferProxy: '',
  erc1155LazyMintTransferProxy: '',
  royalties_proxy: '0x1073e1d5977002d5db4F9E776482E8BF113C745c',
  exchange_wrapper_proxy: '0x388171F81FC91EfC7338E07E52555a90c7D87972',
  customMatcher: '0x875957cA6c9038D7Da37CBFc0FfcF7eb18d85d6A',
};

const bsc_testnet = {
  fees: 200,
  transferProxy: '0x5267e6176b87526979CbE6449a30deD076CA7BA9',
  erc20TransferProxy: '0x8e590eBb2D67bf86b543F6d96Fc1a6A989793c39',
  erc721LazyMintTransferProxy: '',
  erc1155LazyMintTransferProxy: '',
  royalties_proxy: '0x5EC6bFE900C140323C66FC9Fc53619631B46Cb69',
  exchange_wrapper_proxy: '0x00FCf5E8FF15D8b4753c94DdE10fB5a244af74CC',
  ghostmarket: '',
  customMatcher: '',
};

let settings = {
  ethereum_mainnet: ethereum_mainnet,
  ethereum_testnet: ethereum_testnet,
  avalanche_mainnet: avalanche_mainnet,
  avalanche_testnet: avalanche_testnet,
  polygon_mainnet: polygon_mainnet,
  polygon_testnet: polygon_testnet,
  bsc_mainnet: bsc_mainnet,
  bsc_testnet: bsc_testnet,
};

function getSettings(network) {
  if (settings[network] !== undefined) {
    return settings[network];
  } else {
    return {};
  }
}

module.exports = {getSettings};
