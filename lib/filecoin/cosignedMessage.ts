import { newBLSAddress, validateAddressString } from '@glif/filecoin-address';

import { LotusMessage,
         Signature,
         signingBytesLotusMessage,
         blsSignatureType } from './message';
import { BlsPrivateKey, sign } from '../crypto/bls12-381/aggregation';

/**
 * Cosigned Lotus Message explicitly specifies the address of the signer
 * which may differ from the `from` address field included in the message.
 * This is because for the final Lotus message to be broadcast, the from field
 * will specify the aggregated public key of two public keys:
 * the users' public key and the cosigners' public key.
 * In order to obtain the aggregated signature, the cosigned message includes
 * the signature of a single party and it must be verified as such against
 * the signer field, not against the `from` field in the message.
 */
export interface CosignedLotusMessage extends LotusMessage, Signature {
  signer: string;
}

export const cosign = async (
  lotusMessage: LotusMessage,
  privateKey: BlsPrivateKey): Promise<CosignedLotusMessage> => {
  const signingBytes = signingBytesLotusMessage(lotusMessage)
  // sign the CID with secretKey
  // return msg, signature, & address of signer
  const signature = await sign(signingBytes, privateKey);
  const signer =
  const cosignedLotusMessage: CosignedLotusMessage = {
    ...lotusMessage,
    data: signature.toString(), // data of signature as string
    type: blsSignatureType, // BLS signature type
    signer:'abc'
  };
  return Promise.resolve(cosignedLotusMessage);
}

// export const aggregate = (
//   msg1: CosignedLotusMessage,
//   msg2: CosignedLotusMessage
//   ): SignedLotusMessage => {

// }
