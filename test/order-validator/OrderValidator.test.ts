import {expect} from '../utils/chai-setup';
import {ethers} from 'hardhat';
import {TestERC1271, OrderValidatorTest} from '../../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {Asset, Order} from '../utils/order';
import EIP712 from '../utils/EIP712';
import {ZERO} from '../utils/assets';

describe('OrderValidator Test', async function () {
  let orderValidator: OrderValidatorTest;
  let erc1271: TestERC1271;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let wallet3: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    wallet1 = accounts[1];
    wallet2 = accounts[2];
    wallet3 = accounts[3];
    const TestOrderValidator = await ethers.getContractFactory('OrderValidatorTest');
    const TestERC1271 = await ethers.getContractFactory('TestERC1271');
    orderValidator = await TestOrderValidator.deploy();
    await orderValidator.__OrderValidatorTest_init();
    erc1271 = await TestERC1271.deploy();
  });

  it('should validate if signer is correct', async () => {
    const testOrder = Order(
      wallet1.address,
      Asset('0xffffffff', '0x', '100'),
      ZERO,
      Asset('0xffffffff', '0x', '200'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    const signature = await EIP712.sign(testOrder, wallet1.address, orderValidator.address);
    await orderValidator.validateOrderTest(testOrder, signature);
  });

  it('should fail validate if signer is incorrect', async () => {
    const testOrder = Order(
      wallet1.address,
      Asset('0xffffffff', '0x', '100'),
      ZERO,
      Asset('0xffffffff', '0x', '200'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    const signature = await EIP712.sign(testOrder, wallet2.address, orderValidator.address);
    await expect(orderValidator.validateOrderTest(testOrder, signature)).to.be.reverted;
  });

  it('should bypass signature if maker is msg.sender', async () => {
    const testOrder = Order(
      wallet3.address,
      Asset('0xffffffff', '0x', '100'),
      ZERO,
      Asset('0xffffffff', '0x', '200'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    const t3AsSigner = orderValidator.connect(wallet3);
    await t3AsSigner.validateOrderTest(testOrder, '0x', {from: wallet3.address});
  });

  it('should validate if signer is contract and 1271 passes', async () => {
    const testOrder = Order(
      erc1271.address,
      Asset('0xffffffff', '0x', '100'),
      ZERO,
      Asset('0xffffffff', '0x', '200'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    const signature = await EIP712.sign(testOrder, wallet2.address, orderValidator.address);
    await expect(orderValidator.validateOrderTest(testOrder, signature)).to.be.reverted;
    await erc1271.setReturnSuccessfulValidSignature(true);
    await orderValidator.validateOrderTest(testOrder, signature);
  });

  it.skip('should not validate contract don`t support ERC1271_INTERFACE', async () => {
    const testOrder = Order(
      orderValidator.address,
      Asset('0xffffffff', '0x', '100'),
      ZERO,
      Asset('0xffffffff', '0x', '200'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    const signature = await EIP712.sign(testOrder, wallet2.address, orderValidator.address);
    await expect(orderValidator.validateOrderTest(testOrder, signature)).to.be.reverted;
  });

  it('should validate IERC1271 with empty signature', async () => {
    const testOrder = Order(
      erc1271.address,
      Asset('0xffffffff', '0x', '100'),
      ZERO,
      Asset('0xffffffff', '0x', '200'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    await expect(orderValidator.validateOrderTest(testOrder, '0x')).to.be.reverted;
    await erc1271.setReturnSuccessfulValidSignature(true);
    await orderValidator.validateOrderTest(testOrder, '0x');
  });
});
