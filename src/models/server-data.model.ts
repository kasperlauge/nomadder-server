import { ICollectionDefinition } from './collection-definition.model';
import { IServerDataPayload } from './server-data-payload.model';

export interface IServerData {
  serverId: any;
  schemaDefinition: ICollectionDefinition[];
  data: IServerDataPayload[];
}
