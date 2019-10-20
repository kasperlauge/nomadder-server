import * as fs from 'fs';
import { IData } from '../models/data.model';
import { IServerDataIndication } from '../models/server-data-indication.model';
import { IServerDataInfo } from '../models/server-data-info.model';
import { ISyncEventPayload } from '../models/sync-event-payload.model';

export function extractNew(data: IData, fileLocation: string): IServerDataIndication[] {
  const filePath = `${fileLocation}/server-data.json`;
  const newServerData: IServerDataIndication[] = [];
  // Might cause race conditions
  let serverDataInfos: IServerDataInfo[] = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf-8');
    serverDataInfos = JSON.parse(fileData) as IServerDataInfo[];
  }
  /*tslint:disable-next-line:no-console*/
  console.log("data", JSON.stringify(data));
  data.serverData.forEach(serverData => {
    /*tslint:disable-next-line:no-console*/
    console.log("serverData", JSON.stringify(serverData));
    /*tslint:disable-next-line:no-console*/
    console.log("serverDataInfos", JSON.stringify(serverDataInfos));
    let redundancyIndex = 0;
    const similar = serverDataInfos.find(s => s.serverId === serverData.serverId);
    // If we already have the data, and the timestamp is newer or the same then it isn't new data
    if (similar && new Date(similar.timestamp) >= new Date(serverData.timestamp)) {
      similar.redundancyIndex++;
      redundancyIndex = similar.redundancyIndex;
    }
    newServerData.push({ ...serverData, redundancyIndex });
  });
  fs.writeFileSync(filePath, JSON.stringify(serverDataInfos), 'utf-8');
  return newServerData;
}

export function verifyIntegrity(payload: ISyncEventPayload) {
  // This method should verify that the data has not been tampered with using the hash on
  // the payload
  return true;
}
