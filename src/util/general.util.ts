import { IProtocolPayload } from "../models/protocol-information.model";

export function verifyIntegrity(pi: IProtocolPayload, hash: string) {
  // TODO: check if h(pi)==hash
  return true;
} 