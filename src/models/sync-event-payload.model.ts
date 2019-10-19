import { IData } from './data.model';
import { ISchemaDefinition } from './schema-definition.model';
export interface ISyncEventPayload {
  schemaDefintion: ISchemaDefinition;
  data: IData;
  hash: string;
}
