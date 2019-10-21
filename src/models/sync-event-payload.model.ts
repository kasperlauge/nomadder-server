import { ICollectionDefinition } from './collection-definition.model';
import { IData } from './data.model';
export interface ISyncEventPayload {
  schemaDefintion: ICollectionDefinition[];
  data: IData;
  hash: string;
}
