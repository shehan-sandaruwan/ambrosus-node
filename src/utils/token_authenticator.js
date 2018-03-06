import base64url from 'base64url';
import {AuthenticationError, InvalidParametersError} from '../errors/errors';

export default class TokenAuthenticator {
  constructor(identityManager) {
    this.identityManager = identityManager;
  }

  generateToken(secret, timestamp) {
    if (!timestamp || !Number.isInteger(timestamp)) {
      throw new InvalidParametersError('Unix timestamp was not provided or has an invalid format');
    }
    const address = this.identityManager.addressFromSecret(secret);
    const idData = {
      createdBy: address,
      validUntil: timestamp
    };
    return this.encode(this.preparePayload(secret, idData));
  }

  decodeToken(token, timeNow = Date.now()) {
    const decoded = this.decode(token);
    const {signature} = decoded;
    const {idData} = decoded;
    this.identityManager.validateSignature(idData.createdBy, signature, idData);
    if (!decoded.idData.validUntil) {
      throw new AuthenticationError('Invalid token, no expiration date.');
    }

    if (decoded.idData.validUntil < timeNow) {
      throw new AuthenticationError('Token has expired.');
    }

    return decoded;
  }

  preparePayload(secret, idData) {
    const signature = this.identityManager.sign(secret, idData);
    const payload = {signature, idData};
    return payload;  
  }

  decode(token) {
    try {
      return JSON.parse(base64url.decode(token));
    } catch (_e) {
      throw new AuthenticationError('Unable to decode token.');
    }
  }

  encode(data) {
    return base64url(this.identityManager.serializeForHashing(data));
  }
}