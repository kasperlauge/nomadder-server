import { ICollectionDefinition } from './collection-definition.model';
import { ILocalData } from './local-data.model';
import { IServerData } from './server-data.model';

export interface IPersistanceStrategy {
  persistNewData: (serverDataIndications: IServerData[], schemaDefintion: ICollectionDefinition[]) => Promise<void>;
  persistData: (db: ILocalData, fileLocation: string) => void;
}
