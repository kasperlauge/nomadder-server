import { Data } from "./data.model";
import { ServerData } from "./server-data.model";

export enum EventTypes {
    SYNC = "SYNC",
    REFRESH = "REFRESH"
}

export type ProtocolType = "NOMADDER";

export const NOMADDER_PROTOCOL: ProtocolType = "NOMADDER";

export interface NomadderEvent {
    protocol: ProtocolType,
    event: EventTypes;
    payload: SyncEventPayload | RefreshEventPayload;
}

export interface SyncEventPayload {
    data: Data;
}

export interface RefreshEventPayload {
    serverData: ServerData;
}