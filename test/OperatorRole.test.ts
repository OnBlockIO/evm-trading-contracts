import {expect} from '../test/utils/chai-setup';
import {ethers} from 'hardhat';
import {OperatorRoleTest} from '../typechain';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';

describe('OperatorRole Test', function () {
  let operator: OperatorRoleTest;
  let addrs: SignerWithAddress[];
  let testingAsSigner1: OperatorRoleTest;
  let testingAsSigner2: OperatorRoleTest;

  beforeEach(async () => {
    const OP = await ethers.getContractFactory('OperatorRoleTest');
    [...addrs] = await ethers.getSigners();
    operator = await OP.deploy();
    await operator.__OperatorRoleTest_init();
    testingAsSigner1 = operator.connect(addrs[1]);
    testingAsSigner2 = operator.connect(addrs[2]);
  });

  it('should only allow owner to add/remove operators', async () => {
    await expect(
      testingAsSigner1.addOperator(await addrs[1].getAddress(), {from: await addrs[1].getAddress()})
    ).revertedWith('Ownable: caller is not the owner');
    await expect(
      testingAsSigner1.removeOperator(await addrs[1].getAddress(), {from: await addrs[1].getAddress()})
    ).revertedWith('Ownable: caller is not the owner');

    await operator.addOperator(await addrs[1].getAddress());

    const operatorStatus = await operator.getOperator(await addrs[1].getAddress());
    expect(operatorStatus).to.equal(true);

    await operator.removeOperator(await addrs[1].getAddress());
  });

  it('should only allow operator when calling protected functions', async () => {
    await expect(testingAsSigner2.getSomething({from: await addrs[2].getAddress()})).revertedWith(
      'OperatorRole: caller is not the operator'
    );

    await operator.addOperator(await addrs[2].getAddress());
    expect(await testingAsSigner2.getSomething({from: await addrs[2].getAddress()})).to.equal(BigInt(10));

    await expect(testingAsSigner1.getSomething({from: await addrs[1].getAddress()})).revertedWith(
      'OperatorRole: caller is not the operator'
    );
  });
});
