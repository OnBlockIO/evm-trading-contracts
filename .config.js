const ethereum_mainnet = {
  fees: 0,
  transferProxy: '0x1bb6C21e6adB8757F46e77A7F4c5Ad9118f4A04d',
  erc20TransferProxy: '0x153909fB5232c72B5E613aae4898291b014785a1',
  erc721LazyMintTransferProxy: '0x5DF9Db531B5a1Fb476a46f63C196e418fc1BBF01',
  erc1155LazyMintTransferProxy: '0x9298cF6e3e192fc816a3CE27dC8893dBcF684830',
  royalties_proxy: '0x3dA0bD10dfD98E96E04fbAa8e0512b2c413b096A',
  exchange_proxy: '0xfB2F452639cBB0850B46b20D24DE7b0a9cCb665f',
  exchange_wrapper_proxy: '0x2dEbB6CEd142197BEc08d76d3ECCE828b3B261ee',
  customMatcher: '0x468a6Bd8a5A440378f61ec09e4b4408c9Ba8E455',
  rarible: '0x9757F2d2b135150BBeb65308D4a91804107cd8D6',
  looksrare: '0x0000000000E655fAe4d56241588680F86E3b2377',
  seaport_1_5: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC',
  seaport_1_6: '0x0000000000000068F116a894984e2DB1123eB395',
  sudoswap: '0x2B2e8cDA09bBA9660dCA5cB6233787738Ad68329',
  x2y2: '0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3',
  blur: '0x000000000000Ad05Ccc4F10045630fb830B95127',
  wrapped: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  uniswapV2: '',
  uniswapV3: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
};

const ethereum_testnet = {
  fees: 0,
  transferProxy: '0xcCc6964582310f915Ac1AF470Aa7f389387837be',
  erc20TransferProxy: '0x07C68e07F33C4Ec796166390722d50429EFd63E4',
  erc721LazyMintTransferProxy: '0x80762F5ce7d145a1fB61c5527Fa0730E87E0142d',
  erc1155LazyMintTransferProxy: '0xbf975661571d8b6c8970497ed3A45bF59795dF05',
  royalties_proxy: '0x76f2A3A4A2c45719684Df553017bFddD1f43Fa51',
  exchange_proxy: '0x92682fE7884a63e6EB91458E06382fE195823177',
  exchange_wrapper_proxy: '0x53A166616893AAFF432Bc23B5515D2EE862042C5',
  customMatcher: '0xAE477738c5E2a6A00264f26a60F9Ca31A9E95726',
  wrapped: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
  uniswapV2: '',
  uniswapV3: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
};

const avalanche_mainnet = {
  fees: 0,
  transferProxy: '0x3d7e2A3ecb2AE2a516465c611DFf813d7B9297f8',
  erc20TransferProxy: '0x3417E77e81Cf31bb210c2364883EB83E5077f0Dd',
  erc721LazyMintTransferProxy: '0xFa660A5CE5B159C946932c36aA5A7bCa56f1D0fb',
  erc1155LazyMintTransferProxy: '0xdB7d6C0Bc11fe3246a44B8f73C4edeE73Fc521B7',
  royalties_proxy: '0x913FbdC42a77edb0aEFFCEEAe00240C368d9B6b1',
  exchange_proxy: '0xEb4ABA7aeba732Fc2FC92a673585d950cCFC1de0',
  exchange_wrapper_proxy: '0x0C823CD09642864f495F0a474E1d26Dea9A516F9',
  customMatcher: '0x113c8b438687DD1a9b04e7B5984d1fC00E176AD6',
  seaport_1_5: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC',
  seaport_1_6: '0x0000000000000068F116a894984e2DB1123eB395',
  wrapped: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
  uniswapV2: '0xE3Ffc583dC176575eEA7FD9dF2A7c65F7E23f4C3',
  uniswapV3: '',
};

const avalanche_testnet = {
  fees: 0,
  transferProxy: '0x05Ebd261CBd932eaA8e7Dc6C858AF189c77BcdB8',
  erc20TransferProxy: '0xF23121871c3117FFAF860E97A854162900Bd4eaf',
  erc721LazyMintTransferProxy: '0xE6bbAfB291DD683E85520785CC3502CA9ce581A5',
  erc1155LazyMintTransferProxy: '0x388171F81FC91EfC7338E07E52555a90c7D87972',
  royalties_proxy: '0x92bf637c4FadEC1b698002cbA1583850e6EC97d3',
  exchange_proxy: '0x32fD06f88AFc3ce26bbD1cD9FA97dd27BD0826Cd',
  exchange_wrapper_proxy: '0x879cD86a5B2D395455516dd73E5465CD4b8F306D',
  customMatcher: '0x68efd84E9Fe2D36c36243dEB2E9B1d3d3cd15423',
  wrapped: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',
  uniswapV2: '0x0C344c52841d3F8d488E1CcDBafB42CE2C7fdFA9',
  uniswapV3: '',
};

const polygon_mainnet = {
  fees: 0,
  transferProxy: '0x26D583e2CDa958b13CC319FAd124aa729f8A196e',
  erc20TransferProxy: '0x44C5CE28c29934B71A2a0447745d551DfC7B5133',
  erc721LazyMintTransferProxy: '0x6c04dB7aD98880D09b62FA03Fa204C6ec207c4A8',
  erc1155LazyMintTransferProxy: '0x223Ee8844aB016A914d177C9e45C07A0406f2F0A',
  royalties_proxy: '0x7eD7Bff3bEfa9cEDf6A6d4768F4051fEd7fC1975',
  exchange_proxy: '0x3B48563237C32a1f886FD19DB6F5AFFD23855E2a',
  exchange_wrapper_proxy: '0x09236d6b740ac67dCa842D9dB6FA4D067a684E76',
  customMatcher: '0xAB8944314D0eA90fba56644A4989Dd9924F56748',
  rarible: '0x12b3897a36fDB436ddE2788C06Eff0ffD997066e',
  seaport_1_5: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC',
  seaport_1_6: '0x0000000000000068F116a894984e2DB1123eB395',
  wrapped: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  uniswapV2: '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff',
  uniswapV3: '',
};

const polygon_testnet = {
  fees: 0,
  transferProxy: '0x42c81EF5CCd03242c642164037d588557563F085',
  erc20TransferProxy: '0xb24BB6B0d477eA8c0F1eEe4c00b1281B3eF25397',
  erc721LazyMintTransferProxy: '0x6bA8a39421bA37cE20E7D3E95D4714725168b0C3',
  erc1155LazyMintTransferProxy: '0x2001aDDf62723c0F87E9925473ac947D96C3616B',
  royalties_proxy: '0x7E20461EcC3B27586EFEa0e3dB9E80bfbE55B9eB',
  exchange_proxy: '0x5B2e6bEE51bC4Cc389503DD186bA66d98405320F',
  exchange_wrapper_proxy: '0x79d2CD8f785A483176d8EBe58a279c9f2A55F380',
  customMatcher: '0x9725bb445165cf73811EE96E1c45A299205BdADA',
  wrapped: '0x9c3c9283d3e44854697cd22d3faa240cfb032889',
  uniswapV2: '0x8954AfA98594b838bda56FE4C12a09D7739D179b',
  uniswapV3: '',
};

const bsc_mainnet = {
  fees: 0,
  transferProxy: '0x7f61f22C7962F733853C8902Ccf55BC78F379431',
  erc20TransferProxy: '0x2617Ad006cC4D4ed52D3Ed688316feF5b4658845',
  erc721LazyMintTransferProxy: '0x5466C8141f6A017059F3D4849B75CF691DAD167C',
  erc1155LazyMintTransferProxy: '0xdD878D477994D723bD6Da76E740763937753E915',
  royalties_proxy: '0x1073e1d5977002d5db4F9E776482E8BF113C745c',
  exchange_proxy: '0x388171F81FC91EfC7338E07E52555a90c7D87972',
  exchange_wrapper_proxy: '0x32E0C20421c96cA4B423a7806e151e953C647c48',
  customMatcher: '0xD55cA4003B07E692a25bA7EbcCaeC100ED7bf015',
  seaport_1_5: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC',
  seaport_1_6: '0x0000000000000068F116a894984e2DB1123eB395',
  wrapped: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  uniswapV2: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  uniswapV3: '',
};

const bsc_testnet = {
  fees: 0,
  transferProxy: '0x5267e6176b87526979CbE6449a30deD076CA7BA9',
  erc20TransferProxy: '0x8e590eBb2D67bf86b543F6d96Fc1a6A989793c39',
  erc721LazyMintTransferProxy: '0xd691742070F39018525989E29f93b699FD26E22e',
  erc1155LazyMintTransferProxy: '0x0D2a884d843facAB4d7f808Eb4A8E8c47eF8d815',
  royalties_proxy: '0x5EC6bFE900C140323C66FC9Fc53619631B46Cb69',
  exchange_proxy: '0x00FCf5E8FF15D8b4753c94DdE10fB5a244af74CC',
  exchange_wrapper_proxy: '0xB66165b623a6b9D4169323b839b0889CCFa64074',
  customMatcher: '0x627886ec8290cFb1A17A8d51311361ea86075aa2',
  wrapped: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
  uniswapV2: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
  uniswapV3: '',
};

const shardeum_testnet = {
  fees: 0,
  transferProxy: '0xFC02D576F9A47152964d0BD2b61A05EeA817571f',
  erc20TransferProxy: '0x6212E48C100BE32AD83AF290b522D983C5fdcf4c',
  erc721LazyMintTransferProxy: '0xFdA339Dea9e4ccF4D1F9Bb147Bd2df0AA9761Daf',
  erc1155LazyMintTransferProxy: '0xa17E65f379591F6352e20C1E0827072577eaD439',
  royalties_proxy: '0xa100dCC8ce4328cDA39d29bcA537BBA15012d242',
  exchange_proxy: '0xa2af214C9AC3e28f8CE04657DbF102288bDdd0e6',
  exchange_wrapper_proxy: '',
  customMatcher: '0x71e70353b41127dADeA7E3C60aa32CcaddF89098',
  wrapped: '',
  uniswapV2: '',
  uniswapV3: '',
};

const neoevm_testnet = {
  fees: 0,
  transferProxy: '0x76d99FEe987a3A6eE52251C272Da61A797d23e65',
  erc20TransferProxy: '0x0A235CFD523Dd58c80e77Fd33F152781383Fb88E',
  erc721LazyMintTransferProxy: '0x55F02AcD0ba21AFaC507c8C79cF5Bc25A92A6754',
  erc1155LazyMintTransferProxy: '0x946b4e5044Ca9A60A3aB3ab8f70474C9318746E6',
  royalties_proxy: '0x31E02e8d1Fbb0bdeC82f46336BD3eb1759D44B3d',
  exchange_proxy: '0xC881B96b13da75ccBd35Dad5443238ae982e479b',
  exchange_wrapper_proxy: '0xC61F536aa86b84c042349BB88bE3c87E5daC9f75',
  customMatcher: '0x2617Ad006cC4D4ed52D3Ed688316feF5b4658845',
  wrapped: '0x8e392DB6179B0998d5ED432607a8c7Fe7350DDB2',
  uniswapV2: '',
  uniswapV3: '',
};

const base_testnet = {
  fees: 0,
  transferProxy: '0xca1284B5EEb97c31cc693c4b182C8E1075Dc57f9',
  erc20TransferProxy: '0xcCc6964582310f915Ac1AF470Aa7f389387837be',
  erc721LazyMintTransferProxy: '0x07C68e07F33C4Ec796166390722d50429EFd63E4',
  erc1155LazyMintTransferProxy: '0x80762F5ce7d145a1fB61c5527Fa0730E87E0142d',
  royalties_proxy: '0x994b6d56934cC4CD0A887f3256432317c72A6A6B',
  exchange_proxy: '0xAE477738c5E2a6A00264f26a60F9Ca31A9E95726',
  exchange_wrapper_proxy: '0x2C122E0a9048f69F94F42bbd267A452Da91C9c3C',
  customMatcher: '0x94280e5aFCD6d80c3ab6fAbE18eD11e34686C7d3',
  wrapped: '0x6baec3983359fca179c298aa72a79dbeae60decc',
  uniswapV2: '',
  uniswapV3: '',
};

const base_mainnet = {
  fees: 0,
  transferProxy: '0x31681e95A89034612926908F48A5E1Aa734EBf05',
  erc20TransferProxy: '0xE98E9D752d6104aDa0520988cd1834035762C8c7',
  erc721LazyMintTransferProxy: '0x3d7e2A3ecb2AE2a516465c611DFf813d7B9297f8',
  erc1155LazyMintTransferProxy: '0x3417E77e81Cf31bb210c2364883EB83E5077f0Dd',
  royalties_proxy: '0x92E20C3534535db17D4c7c622538eB0930544230',
  exchange_proxy: '0x31E02e8d1Fbb0bdeC82f46336BD3eb1759D44B3d',
  exchange_wrapper_proxy: '0x4B077688Be301427b68E8e9C1Dac7BC6a1a74Ccc',
  customMatcher: '0xC852372E60067f5bE1E96BBB038218a5081A9807',
  rarible: '0x6C65a3C3AA67b126e43F86DA85775E0F5e9743F7',
  seaport_1_5: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC',
  seaport_1_6: '0x0000000000000068F116a894984e2DB1123eB395',
  wrapped: '0x4200000000000000000000000000000000000006',
  uniswapV2: '',
  uniswapV3: '0x2626664c2603336E57B271c5C0b26F421741e481',
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
  shardeum_testnet: shardeum_testnet,
  neoevm_testnet: neoevm_testnet,
  base_testnet: base_testnet,
  base_mainnet: base_mainnet,
};

function getSettings(network) {
  if (settings[network] !== undefined) {
    return settings[network];
  } else {
    return {};
  }
}

module.exports = {getSettings};
