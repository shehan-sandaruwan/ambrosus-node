/*
Copyright: Ambrosus Technologies GmbH
Email: tech@ambrosus.com

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.

This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0.
*/

import https from 'https';
import http from 'http';
import URL from 'url';
import {NotFoundError, PermissionError, ValidationError, AuthenticationError} from '../errors/errors';

export default class HttpsClient {
  async performHTTPSGet(uri, path) {
    const {protocol, hostname, port} = URL.parse(uri);
    const agent = this.getAgentFromProtocol(protocol);
    const options = {
      hostname,
      path,
      port
    };
    return new Promise((resolve, reject) => {
      try {
        agent.get(options, (res) => {
          let rawData = '';
          let parsedData;
          res.on('data', (chunk) => rawData += chunk);
          res.on('end', () => {
            try {
              parsedData = JSON.parse(rawData);
            } catch (error) {
              reject(error);
            }
            resolve({body: parsedData, statusCode: res.statusCode});
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getAgentFromProtocol(protocol) {
    if (protocol.startsWith('https')) {
      return https;
    } else if (protocol.startsWith('http')) {
      return http;
    }
    throw Error(`Invalid protocol ${protocol}`);
  }

  validateIncomingStatusCode(statusCode, url) {
    const errorMsg = `Received code ${statusCode} at ${url}`;
    switch (statusCode) {
      case 200:
        return;
      case 400:
        throw new ValidationError(errorMsg);
      case 401:
        throw new AuthenticationError(errorMsg);
      case 403:
        throw new PermissionError(errorMsg);
      case 404:
        throw new NotFoundError(errorMsg);
      default:
        throw new Error(errorMsg);
    }
  }
}
