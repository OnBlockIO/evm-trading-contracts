import {expect} from '../test/utils/chai-setup';
import {Royalties2981TestImpl} from '../typechain';
import {ethers} from 'hardhat';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

describe('Royalties2981 Test', async function () {
  let wallet1: SignerWithAddress;
  let royalties2981TestImpl: Royalties2981TestImpl;

  before(async function () {
    const accounts = await ethers.getSigners();
    wallet1 = accounts[1];
    const Royalties2981TestImpl = await ethers.getContractFactory('Royalties2981TestImpl');
    royalties2981TestImpl = await Royalties2981TestImpl.deploy();
  });

  it('simple impl works', async () => {
    const amount = '100';
    const getRoyalties = wallet1.address;
    const tokenId = getRoyalties + 'b00000000000000000000001';

    const result = await royalties2981TestImpl.royaltyInfo(tokenId, amount);
    expect(result[0]).to.equal(getRoyalties);
    expect(result[1]).to.equal(10);
  });
});
