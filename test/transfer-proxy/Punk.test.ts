import {expect} from '../utils/chai-setup';
import {ethers} from 'hardhat';
import {CRYPTO_PUNK, enc} from '../utils/assets';
import {Asset} from '../utils/order';
import {PunkTransferProxy, CryptoPunksMarket} from '../../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {inReceipt} from '../utils/expectEvent';

describe('PunkTransferProxy Test', () => {
  let punkIndex: number;
  let punkTransferProxy: PunkTransferProxy;
  let cryptoPunksMarket: CryptoPunksMarket;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    wallet1 = accounts[1];
    wallet2 = accounts[2];
    punkIndex = 256;
    const CryptoPunksMarket = await ethers.getContractFactory('CryptoPunksMarket');
    const PunkTransferProxy = await ethers.getContractFactory('PunkTransferProxy');
    cryptoPunksMarket = await CryptoPunksMarket.deploy();
    await cryptoPunksMarket.allInitialOwnersAssigned(); //allow test contract work with Punk CONTRACT_OWNER accounts[0]
    punkTransferProxy = await PunkTransferProxy.deploy();
    await punkTransferProxy.__OperatorRole_init();
    await punkTransferProxy.addOperator(wallet1.address);
  });

  it('should work for proxy transfer punk', async () => {
    await cryptoPunksMarket.connect(wallet1).getPunk(punkIndex); //wallet1 - owner punk with punkIndex
    await cryptoPunksMarket.connect(wallet1).offerPunkForSaleToAddress(punkIndex, 0, punkTransferProxy.address); //wallet1 - wants to sell punk with punkIndex, min price 0 wei

    expect(await cryptoPunksMarket.balanceOf(wallet1.address)).to.be.equal(1); //punk owner - wallet1
    const encodedPunkData = await enc(cryptoPunksMarket.address, punkIndex.toString());

    await punkTransferProxy
      .connect(wallet1)
      .transfer(Asset(CRYPTO_PUNK, encodedPunkData, '1'), wallet1.address, wallet2.address);
    expect(await cryptoPunksMarket.balanceOf(wallet1.address)).to.be.equal(0);
    expect(await cryptoPunksMarket.balanceOf(punkTransferProxy.address)).to.be.equal(0);
    expect(await cryptoPunksMarket.balanceOf(wallet2.address)).to.be.equal(1); //punk owner - wallet2
  });

  it('should fail when trying to transfer punk, which not offer to sale', async () => {
    await cryptoPunksMarket.connect(wallet1).getPunk(punkIndex); //wallet1 - owner punk with punkIndex
    await cryptoPunksMarket.connect(wallet1).offerPunkForSaleToAddress(punkIndex, 0, punkTransferProxy.address); //wallet1 - wants to sell punk to proxy with punkIndex, min price 0 wei
    const anotherPunkIndex = 300;
    expect(await cryptoPunksMarket.balanceOf(wallet1.address)).to.be.equal(1); //punk owner wallet1
    const encodedPunkData = await enc(cryptoPunksMarket.address, anotherPunkIndex.toString());

    await expect(
      punkTransferProxy
        .connect(wallet1)
        .transfer(Asset(CRYPTO_PUNK, encodedPunkData, '1'), wallet1.address, wallet2.address)
    ).to.be.reverted;
  });

  it('should fail when trying to transfer punk, which offer not for punkTransferProxy.address', async () => {
    await cryptoPunksMarket.connect(wallet1).getPunk(punkIndex); //wallet1 - owner punk with punkIndex
    await cryptoPunksMarket.connect(wallet1).offerPunkForSaleToAddress(punkIndex, 0, wallet2.address); //wallet1 - wants to sell punk to wallet2 with punkIndex, min price 0 wei

    expect(await cryptoPunksMarket.balanceOf(wallet1.address)).to.be.equal(1); //punk owner wallet1
    const encodedPunkData = await enc(cryptoPunksMarket.address, punkIndex.toString());

    await expect(
      punkTransferProxy
        .connect(wallet1)
        .transfer(Asset(CRYPTO_PUNK, encodedPunkData, '1'), wallet1.address, wallet2.address)
    ).to.be.reverted;
  });

  it('should check punk event correctly', async () => {
    await cryptoPunksMarket.connect(wallet1).getPunk(punkIndex); //wallet1 - owner punk with punkIndex
    const resOffer = await (
      await cryptoPunksMarket.connect(wallet1).offerPunkForSaleToAddress(punkIndex, 5, punkTransferProxy.address)
    ).wait(); //wallet1 - wants to sell punk with punkIndex, min price 0 wei
    inReceipt(resOffer, 'PunkOffered', {toAddress: punkTransferProxy.address, punkIndex: punkIndex, minValue: 5});
  });
});
