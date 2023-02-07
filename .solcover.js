module.exports = {
  skipFiles: [
    'custom-matcher/tests/',
    'exchange/tests/',
    'exchange-wrapper/tests/',
    'interfaces/tests/',
    'librairies/tests/',
    'operator/tests/',
    'royalties/tests/',
    'royalties-registry/tests/',
    'tokens/tests/',
    'transfer-manager/tests/',
    'transfer-proxy/tests/',
    'mint/',
    'legacy/',
    'librairies/LibERC721LazyMint.sol', // tested in other repo
    'librairies/LibERC1155LazyMint.sol', // tested in other repo
    'royalties/GhostMarketRoyalties.sol', // abstract which will be dropped once we had proper 2981
  ],
};
