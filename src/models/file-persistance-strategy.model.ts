import * as fs from 'fs';
import { ICollectionDefinition } from './collection-definition.model';
import { IFilePersistanceStrategyConfig } from './file-persistance-strategy-config.model';
import { IPersistanceStrategy } from './persistance-strategy.model';
import { IServerData } from './server-data.model';

export class FilePersistanceStrategy implements IPersistanceStrategy {
  private fileLocation: string;

  constructor({ fileLocation = './schemas' }: IFilePersistanceStrategyConfig) {
    this.fileLocation = fileLocation;
  }

  public persistNewData(newData: IServerData[], schemaDefinition: ICollectionDefinition[]) {
    const colsToAdd = this.findCollectionsToAdd(schemaDefinition);
    colsToAdd.forEach(c => this.addCollection(c));
    const groupedData = this.groupData(newData);
    this.upsertGroupedData(groupedData);

    return Promise.resolve();
  }

  private findCollectionsToAdd(schemaDefinition: ICollectionDefinition[]): ICollectionDefinition[] {
    return schemaDefinition.filter(c => !fs.existsSync(`${this.fileLocation}/${c.name}.json`));
  }

  private groupData(newData: IServerData[]): IGroupedServerData[] {
    const collections: IGroupedServerData[] = [];
    for (const sd of newData) {
      for (const d of sd.data) {
        const colInd = collections.findIndex(c => c.collectionName === d.collectionName);
        if (colInd !== -1) {
          collections[colInd].data.push({ data: d.payload, id: d.id });
        } else {
          collections.push({ collectionName: d.collectionName, data: [{ data: d.payload, id: d.id }] });
        }
      }
    }
    return collections;
  }

  private addCollection(collection: ICollectionDefinition) {
    fs.writeFileSync(`${this.fileLocation}/${collection.name}.json`, [], 'utf-8');
  }

  private upsertGroupedData(groupedData: IGroupedServerData[]) {
    groupedData.forEach(gd => {
      // Check to make sure schema fits with data
      const currentFile = `${this.fileLocation}/${gd.collectionName}.json`;
      if (fs.existsSync(currentFile)) {
        const fileContent = fs.readFileSync(currentFile, 'utf-8');
        const collectionData = JSON.parse(fileContent) as IServerDataItem[];
        gd.data.forEach(sd => this.upsertSingleItem(sd, collectionData));
      }
    });
  }

  private upsertSingleItem(serverDataItem: IServerDataItem, collectionData: IServerDataItem[]) {
    const colInd = collectionData.findIndex(c => c.id === serverDataItem.id);
    if (colInd !== -1) {
      collectionData[colInd] = serverDataItem;
    } else {
      collectionData.push(serverDataItem);
    }
  }
}

export interface IGroupedServerData {
  collectionName: string;
  data: IServerDataItem[];
}

export interface IServerDataItem {
  id: any;
  data: any;
}
