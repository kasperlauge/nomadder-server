import { ICollectionDefinition } from './collection-definition.model';
import { IServerData } from './server-data.model';

export interface IPersistanceStrategy {
  persistNewData: (serverDataIndications: IServerData[], schemaDefintion: ICollectionDefinition[]) => Promise<void>;
}
