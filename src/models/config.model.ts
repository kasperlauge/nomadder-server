import { Server } from 'ws';
import { IPersistanceStrategy } from './persistance-strategy.model';
export interface IConfig {
  serverId?: any;
  websocket: Server;
  fileLocation?: string;
  persistenceStrategy?: IPersistanceStrategy;
  redundancyLimit?: number;
  redundancyFactor?: number;
}

export interface IConfigParameters {
  serverId: any;
  websocket: Server;
  fileLocation: string;
  persistenceStrategy: IPersistanceStrategy;
  redundancyLimit: number;
  redundancyFactor: number;
}
