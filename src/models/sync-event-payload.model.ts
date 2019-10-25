import { ICollectionDefinition } from './collection-definition.model';
import { IData } from './data.model';
import { IServerData } from './server-data.model';
export interface ISyncEventPayload {
  data: IServerData;
  hash: string;
}
