/*
Copyright: Ambrosus Technologies GmbH
Email: tech@ambrosus.com

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.

This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0.
*/

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  checkIfEnoughFundsToPayForGas,
  createWeb3,
  getBalance,
  getDefaultAddress,
  maximalGasPrice
} from '../../src/utils/web3_tools';
import sinon from 'sinon';

chai.use(chaiAsPromised);
const {expect} = chai;

describe('Web3 tools', () => {
  let web3;
  let address;

  before(async () => {
    web3 = await createWeb3();
    address = getDefaultAddress(web3);
  });

  it(`getBalance returns user's balance`, async () => {
    const realBalance = await web3.eth.getBalance(address);
    expect(await getBalance(web3, address)).to.equal(realBalance);
  });

  it('maximalGasPrice returns correct value', () => {
    expect(maximalGasPrice()).to.equal('23500000000000000');
  });

  describe('checkIfEnoughFundsToPayForGas', () => {
    let getBalanceMock;

    before(() => {
      getBalanceMock = sinon.stub(web3.eth, 'getBalance');
    });

    after(() => {
      getBalanceMock.restore();
    });

    it('returns false if balance is less than maxGasPrice', async () => {
      getBalanceMock.resolves('13500000000000000');
      expect(await checkIfEnoughFundsToPayForGas(web3, address)).to.be.false;
    });

    it('returns false if balance is greater or equals to maxGasPrice', async () => {
      getBalanceMock.resolves('23500000000000000');
      expect(await checkIfEnoughFundsToPayForGas(web3, address)).to.be.true;
      getBalanceMock.resolves('23500000000000001');
      expect(await checkIfEnoughFundsToPayForGas(web3, address)).to.be.true;
    });
  });
});
