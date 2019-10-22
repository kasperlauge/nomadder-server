import { ICollectionDefinition } from './collection-definition.model';
import { ILocalData } from './local-data.model';
import { IServerData } from './server-data.model';

export interface IPersistanceStrategy {
  persistData(db: ILocalData): void;
  retrieveCache(): ILocalData;
}
