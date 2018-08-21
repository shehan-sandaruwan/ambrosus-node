/*
Copyright: Ambrosus Technologies GmbH
Email: tech@ambrosus.com

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.

This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0.
*/

export default class HermesUploadStrategy {
  get workerInterval() {
    return 1000;
  }

  storagePeriods() {
    return 1;
  }

  // eslint-disable-next-line no-unused-vars
  async shouldBundle(bundle) {
    throw new Error('Should be implemented');
  }

  async bundlingSucceeded() {
    throw new Error('Should be implemented');
  }
}