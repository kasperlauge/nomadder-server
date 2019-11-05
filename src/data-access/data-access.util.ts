import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { getDb } from '..';
import { IServerDataItem } from '../models/server-data-item.model';

export function getCollection(collectionName: string): Observable<IServerDataItem[]> {
  return getDb()
    .asObservable()
    .pipe(take(1))
    .pipe(map(db => {
      const collection = db.groupedServerData.find(gd => gd.collectionName === collectionName);
      if (collection === undefined) {
        return [] as IServerDataItem[];
      } else {
        return collection.data;
      }
    }));
}

export function upsertDataPoint(collectionName: string, id: any, data: any): Observable<boolean> {
  // tslint:disable: no-console
  console.log("Upsert called");
  const done = new BehaviorSubject<boolean | null>(null);
  getDb().asObservable().pipe(take(1)).subscribe(db => {
    const collection = db.groupedServerData.find(gd => gd.collectionName === collectionName);
    console.log("Collection found: ", collection);
    if (!collection) {
      db.groupedServerData.push({
        collectionName,
        data: [
          {
            data,
            id,
            timestamp: new Date().getTime(),
            uniqueServerIds: []
          }
        ]
      });
    } else {
      const index = collection.data.findIndex(d => d.id === id);
      console.log("Index found: ", index);
      if (index === -1) {
        collection.data.push({
          data, 
          id, 
          timestamp: new Date().getTime(), 
          uniqueServerIds: []
        });
      } else {
        collection.data[index].data = data;
        collection.data[index].timestamp = new Date().getTime();
        collection.data[index].uniqueServerIds = [];
      }
    }
    getDb().next(db);
    done.next(true);
  });
  return done.asObservable()
    .pipe(filter(d => d !== null))
    .pipe(map(d => d as boolean))
    .pipe(take(1));
}