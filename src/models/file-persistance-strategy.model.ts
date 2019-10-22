import * as fs from 'fs';
import { ICollectionDefinition } from './collection-definition.model';
import { IFilePersistanceStrategyConfig } from './file-persistance-strategy-config.model';
import { IGroupedServerData } from './grouped-server-data.model';
import { ILocalData } from './local-data.model';
import { IPersistanceStrategy } from './persistance-strategy.model';
import { IServerDataItem } from './server-data-item.model';
import { IServerData } from './server-data.model';

export class FilePersistanceStrategy implements IPersistanceStrategy {
  private fileLocation: string;

  constructor({ fileLocation = './schemas' }: IFilePersistanceStrategyConfig) {
    this.fileLocation = fileLocation;
  }

  public persistData(db: ILocalData, fileLocation: string) {
    const serverDataFile = `${fileLocation}/server-data.json`;
    fs.writeFile(serverDataFile, JSON.stringify(db.serverDataInfo), () => {
      // tslint:disable-next-line: no-console
      console.log('Cached data');
    });
    const collectionLocation = `${fileLocation}/collections`;
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
}
