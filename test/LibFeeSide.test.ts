import {expect} from '../test/utils/chai-setup';
import {LibFeeSideTest} from '../typechain';
import {ethers} from 'hardhat';
import {ETH, ERC20, ERC721, ERC1155} from './utils/assets';

describe('LibFeeSide Test', async function () {
  let lib: LibFeeSideTest;
  const FEE_SIDE_NONE = 0;
  const FEE_SIDE_MAKE = 1;
  const FEE_SIDE_TAKE = 2;

  before(async function () {
    const LibFeeSide = await ethers.getContractFactory('LibFeeSideTest');
    lib = await LibFeeSide.deploy();
  });

  it('should work ETH, ERC20; MAKE wins ', async () => {
    const fee = await lib.getFeeSideTest(ETH, ERC20);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it('should work ERC20, ETH; TAKE wins ', async () => {
    const fee = await lib.getFeeSideTest(ERC20, ETH);
    expect(fee).to.equal(FEE_SIDE_TAKE);
  });

  it('should work ERC20, ERC1155; MAKE wins ', async () => {
    const fee = await lib.getFeeSideTest(ERC20, ERC1155);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it('should work ERC1155, ERC20; TAKE wins ', async () => {
    const fee = await lib.getFeeSideTest(ERC1155, ERC20);
    expect(fee).to.equal(FEE_SIDE_TAKE);
  });

  it('should work ERC1155, ETH; TAKE wins ', async () => {
    const fee = await lib.getFeeSideTest(ERC1155, ETH);
    expect(fee).to.equal(FEE_SIDE_TAKE);
  });

  it('should work ETH, ERC1155; MAKE wins ', async () => {
    const fee = await lib.getFeeSideTest(ETH, ERC1155);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it('should work ERC721, ETH; TAKE wins ', async () => {
    const fee = await lib.getFeeSideTest(ERC721, ETH);
    expect(fee).to.equal(FEE_SIDE_TAKE);
  });

  it('should work ERC20, ERC721; MAKE wins ', async () => {
    const fee = await lib.getFeeSideTest(ERC20, ERC721);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it('should work ERC1155, ERC721; MAKE wins ', async () => {
    const fee = await lib.getFeeSideTest(ERC1155, ERC721);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it('should work ERC721, ERC721; NONE wins ', async () => {
    const fee = await lib.getFeeSideTest(ERC721, ERC721);
    expect(fee).to.equal(FEE_SIDE_NONE);
  });

  it('should work ETH, not Asset; MAKE wins ', async () => {
    const fee = await lib.getFeeSideTest(ETH, '0x12345678');
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });

  it('should work not Asset, ERC1155; TAKE wins ', async () => {
    const fee = await lib.getFeeSideTest('0x12345678', ERC1155);
    expect(fee).to.equal(FEE_SIDE_TAKE);
  });

  it('should work not Asset, not Asset; NONE wins ', async () => {
    const fee = await lib.getFeeSideTest('0x12345678', '0x87654321');
    expect(fee).to.equal(FEE_SIDE_NONE);
  });

  it('should work MAKE == TAKE; MAKE wins ', async () => {
    const fee = await lib.getFeeSideTest(ETH, ETH);
    expect(fee).to.equal(FEE_SIDE_MAKE);
  });
});
