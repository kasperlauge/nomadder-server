import { IServerData } from "./server-data.model";

export interface IPersistanceStrategy {
  persistNewData: (serverDataIndications: IServerData[]) => Promise<void>
}
