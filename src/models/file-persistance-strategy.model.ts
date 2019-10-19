import { IPersistanceStrategy } from "./persistance-strategy.model";
import { IServerData } from "./server-data.model";

export class FilePersistanceStrategy implements IPersistanceStrategy {
  public persistNewData(newData: IServerData[]) {
    return Promise.resolve();
  }

}