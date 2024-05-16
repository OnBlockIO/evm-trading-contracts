/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from './chai-setup';
import hre from 'hardhat';

export async function getLastTokenID(token: any): Promise<bigint> {
  const counter = await token.getCurrentCounter();
  if (counter == 1) {
    return BigInt(parseInt(counter));
  } else return BigInt(parseInt(counter) - 1);
}

export async function verifyBalanceChange(account: string, change: number, todo: any): Promise<Chai.Assertion> {
  const before = BigInt(await hre.web3.eth.getBalance(account));
  await todo();
  const after = BigInt(await hre.web3.eth.getBalance(account));
  const actual = before - after;
  return expect(actual).to.equal(BigInt(change.toString()));
}

export async function verifyBalanceChangeReturnTx(account: string, change: number, todo: any) {
  const before = BigInt(await hre.web3.eth.getBalance(account));
  const tx = await todo();
  const after = BigInt(await hre.web3.eth.getBalance(account));
  const actual = before - after;
  expect(BigInt(change)).to.equal(actual);
  return tx;
}

export function encDataV1JS(data: any): string {
  const result = hre.web3.eth.abi.encodeParameter('tuple(address,uint256)[][]', data);
  //compared to solidity abi.encode function, web3.eth.abi.encodeParameter adds an additional
  // 0000000000000000000000000000000000000000000000000000000000000002
  // its removed before the result is returned
  return result.replace('0000000000000000000000000000000000000000000000000000000000000002', '');
}

export function expectEqualStringValues(value1: any, value2: any): Chai.Assertion {
  return expect(value1.toString()).to.equal(value2.toString());
}
