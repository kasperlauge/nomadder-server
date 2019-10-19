import { Server } from 'ws';
import { IPersistanceStrategy } from './persistance-strategy.model';
export interface IConfig {
  websocket: Server;
  fileLocation: string;
  persistenceStrategy: IPersistanceStrategy;
  redundancyLimit: number;
}
