import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { getDb } from "..";
import { IGroupedServerData } from "../models/grouped-server-data.model";

export function getCollection(collectionName: string): Observable<IGroupedServerData | null> {
  return getDb().asObservable().pipe(map(db => db.groupedServerData.find(gd => gd.collectionName === collectionName) || null));
}