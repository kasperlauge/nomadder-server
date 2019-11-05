import { IProtocolPayload } from './protocol-information.model';

export enum EventTypes {
  SYNC = 'SYNC',
  BATCH = 'BATCH',
}

export type ProtocolType = 'NOMADDER';

export const NOMADDER_PROTOCOL: ProtocolType = 'NOMADDER';

export interface INomadderEvent {
  protocol: ProtocolType;
  protocolInformation: IProtocolPayload;
  hash: string;
}
