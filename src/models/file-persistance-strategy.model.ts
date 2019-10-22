import * as fs from 'fs';
import { IFilePersistanceStrategyConfig } from './file-persistance-strategy-config.model';
import { ILocalData } from './local-data.model';
import { IPersistanceStrategy } from './persistance-strategy.model';
import { IServerDataItem } from './server-data-item.model';
import { IGroupedServerData } from './grouped-server-data.model';

export class FilePersistanceStrategy implements IPersistanceStrategy {
  private fileLocation: string;

  constructor({ fileLocation = '.' }: IFilePersistanceStrategyConfig) {
    this.fileLocation = fileLocation;
  }

  public persistData(db: ILocalData) {
    const serverDataFile = `${this.fileLocation}/server-data.json`;
    fs.writeFile(serverDataFile, JSON.stringify(db.serverDataInfo), () => {
      // tslint:disable-next-line: no-console
      console.log('Cached data');
    });
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
    const localData = { serverDataInfo: [], groupedServerData: [] } as ILocalData;
    const serverDataPath = `${this.fileLocation}/server-data.json`;
    const  collectionPath = `${this.fileLocation}/collections`;
    if (fs.existsSync(serverDataPath)) {
      const serverData = fs.readFileSync(`${this.fileLocation}/server-data.json`, "utf-8");
      const serverDataInfo = JSON.parse(serverData);
      localData.serverDataInfo = serverDataInfo;
    }
    if (fs.existsSync(collectionPath)) {
      const fileNames = fs.readdirSync(collectionPath, "utf-8");
      fileNames.forEach(fileName => {
        const collectionData = fs.readFileSync(`${collectionPath}/${fileName}.json`, "utf-8");
        const collectionDataJson = JSON.parse(collectionData) as IServerDataItem[];
        const groupedServerDataItem = {collectionName: fileName.slice(0,-5), data: collectionDataJson} as IGroupedServerData;
        localData.groupedServerData.push(groupedServerDataItem);
      });
    }
    return localData;
  }
}
