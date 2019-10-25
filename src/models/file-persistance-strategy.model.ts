import * as fs from 'fs';
import { IFilePersistanceStrategyConfig } from './file-persistance-strategy-config.model';
import { IGroupedServerData } from './grouped-server-data.model';
import { ILocalData } from './local-data.model';
import { IPersistanceStrategy } from './persistance-strategy.model';
import { IServerDataItem } from './server-data-item.model';

export class FilePersistanceStrategy implements IPersistanceStrategy {
  private fileLocation: string;

  constructor({ fileLocation = '.' }: IFilePersistanceStrategyConfig) {
    this.fileLocation = fileLocation;
  }

  public persistData(db: ILocalData) {
    const collectionLocation = `${this.fileLocation}/collections`;
    if (fs.existsSync(collectionLocation)) {
      db.groupedServerData.forEach(gds => {
        fs.writeFile(`${collectionLocation}/${gds.collectionName}.json`, JSON.stringify(gds.data), error => {
          // Do nothing
          // tslint:disable-next-line: no-console
          console.log('Error?:', error);
        });
      });
    } else {
      fs.mkdir(collectionLocation, () => {
        db.groupedServerData.forEach(gds => {
          fs.writeFile(`${collectionLocation}/${gds.collectionName}.json`, JSON.stringify(gds.data), () => {
            // Do nothing
          });
        });
      });
    }
  }

  public retrieveCache(): ILocalData {
    const localData = { id: null, groupedServerData: [] } as ILocalData;
    const collectionPath = `${this.fileLocation}/collections`;
    if (fs.existsSync(collectionPath)) {
      const fileNames = fs.readdirSync(collectionPath, 'utf-8');
      fileNames.forEach(fileName => {
        const collectionData = fs.readFileSync(`${collectionPath}/${fileName}`, 'utf-8');
        const collectionDataJson = JSON.parse(collectionData) as IServerDataItem[];
        const groupedServerDataItem = {
          collectionName: fileName.slice(0, -5),
          data: collectionDataJson,
        } as IGroupedServerData;
        localData.groupedServerData.push(groupedServerDataItem);
      });
    }
    // TODO: get cached ID somewhere aswell
    return localData;
  }
}
