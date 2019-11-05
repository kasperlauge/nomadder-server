## Nomadder server framework

A web based nomadic data sharing framework between non-internet connected servers

### Usuage
The server exposes a setup method which should need a websocket object to be able to operate, an example setup could be:

```
import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import * as os from "os";
import * as crypto from "crypto";
import { setup } from "nomadder-server";

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const macAddress = os.networkInterfaces()["wlp2s0"][0]["mac"];
const hash = crypto.createHash("sha256");
const uniqueId = hash.update(macAddress).digest("hex").slice(0, 25);

setup({
  websocket: wss,
  serverId: uniqueId
});
```

The serverId property is to uniquely identify this server from others. The framework uses this to decide which of the data should be spread accross the different clients connected to the server. A solution to get an unique id could be to use the hash of the servers MAC address.

The server also exposes some functions to interact with the internal database of the framework.
1. getCollection(collectionName: string): Observable<IServerDataItem[]>
2. upsertDataPoint(collectionName: string, id: any, data: any): Observable<boolean>

Example usage of these could be a server serving some REST endpoints to get the data from a specific collection in the database.

```
import { Request, Response, NextFunction } from "express";
import { getCollection, upsertDataPoint } from "nomadder-server";

export function getFruits(req: Request, res: Response, next: NextFunction) {
  getCollection("fruits").subscribe(d => {
    console.log("Fruit collection: ", d);
    res.status(200).json({fruits: d});
  });
}

export function postFruitData(req: Request, res: Response, next: NextFunction) {
  const id = req.body["id"];
  const data = req.body["data"];
  upsertDataPoint("fruits", id, data).subscribe(_ => {
    res.status(200).json({id, data});
  });
}
```

### Explanation

When the setup-method have been called the nomadder-server framework sets up a listener via Websocket. It will listen for all events for the "nomadder" protocol. There are two types of events for the protocol: SYNC and BATCH.

#### SYNC-event

The SYNC event serves as connected message from the client to the server. When a clients have established a connection via websocket to the server it should initiate the protocol by sending a SYNC-event. The SYNC-event is a stringified JSON object sent via websocket. So when the client starts the protocol it could look like this (using localhost):

```
var ws = new WebSocket("ws://localhost:8080")
ws.send('{"protocol":"NOMADDER", "protocolInformation": {"event":"SYNC","payload":{"data":{"serverId":"6","data":[{"collectionName":"fruits","id":"128","payload":{"name":"orange","amount":13}, "timestamp": 1571987038443}], "schemaDefinition": [{"name": "fruits"}]}}}, "hash": "123"}')
```

The SYNC-event object is as follows:

```
{
  "protocol": "NOMADDER", //  1
  "hash": "123", // 2
  "protocolInformation": {
    "event": "SYNC", // 3
    "payload": {
      "data": {
        "serverId": "6", // 4
        "data": [ // 5
          {
            "collectionName": "fruits", // 6
            "id": "128", // 7
            "payload": { // 8
              "name": orange",
              "amount": 13
            },
            "timestamp": 1571987038443 // 9
          }
        ],
        "schemaDefinition": [ // 10
          {
            "name": "fruits" // 11
          }
        ]
      }
    }
  }
}
```

Explanations for properties:
1. string type - This is used to ignore other websocket activity
2. string type - Ideally a hash of the protocolInformation object this will be received through the BATCH-event from the server
3. string type - Should be SYNC for a SYNC event
4. The serverId for which the last data was received, this will be present in the BATCH-event - related to redundancyLimit property
5. array type - An array of data entries which this client got from the last server visited (from a BATCH-event)
6. string type - Name of the collection for which this data point belongs
7. string type - Id from the last server visited - This value is used by the server receiving the SYNC event to determine if a data entry have been spread enough around in the network
8. object/any type - The data entry which actually needs to be stored - A JSON object containing the data which is being parsed around between differnet servers
9. number type - A timestamp currently from the method new Date().getTime() made from the last time this dataentry was updated - This is used to determine the freshness of the dataentry
10. An array of the different collections from the server from which this client got the last data from - also received from BATCH-event. 
11. string type - Name of one of the collections from the last server visited. This information is received through the BATCH-event

#### BATCH-event

The BATCH-event is sent from the server to all clients connected (via websocket) each time the data within the current server changes. The BATCH event sends a precalculated batch of the entire data lying within this server to a client. If a server have 100 data entries within the fruit collection (and that is the only collection within the database) and the server have a reduncyFactor of 2 and 10 clients is connected to the server, then the calculationis as follows:
2*100=200 dataentries in total
Each client will then get 200/10=20 dataentries within that clients BATCH-event.

The BATCH-event object is as follows:

```
{
  "protocol": "NOMADDER", //  1
  "hash": "123", // 2
  "protocolInformation": {
    "event": "BATCH", // 3
    "payload": {
      "data": {
        "serverId": "6", // 4
        "data": [ // 5
          {
            "collectionName": "fruits", // 6
            "id": "128", // 7
            "payload": { // 8
              "name": orange",
              "amount": 13
            },
            "timestamp": 1571987038443 // 9
          }
        ],
        "schemaDefinition": [ // 10
          {
            "name": "fruits" // 11
          }
        ]
      }
    }
  }
}
```

Explanations for properties:
1. string type - This is used to ignore other websocket activity
2. string type - Ideally a hash of the protocolInformation object
3. string type - Should be BATCH for a BATCH event
4. The serverId for which the last data was received
5. array type - An array of data entries which this client got from this server through the BATCH-event
6. string type - Name of the collection for which this data point belongs
7. string type - Id from the last server visited - This value is used by the server receiving the SYNC event to determine if a data entry have been spread enough around in the network
8. object/any type - The data entry which is from the current server - A JSON object containing the data which is being parsed around between differnet servers
9. number type - A timestamp currently from the method new Date().getTime() made from the last time this dataentry was updated - This is used to determine the freshness of the dataentry
10. An array of the different collections this server knows about
11. string type - Name of one of the collections from the last server visited

The client should react on the BATCH-event and persist the data almost as is. Then when connecting to a new server the client should send this data as a SYNC-event to that new server.

### Scenario

With two clients and one server the scenario would look something like this:

```
+---------+                      +---------+                                      +---------+                                                  +-----------+
| client1 |                      | client2 |                                      | server  |                                                  | database  |
+---------+                      +---------+                                      +---------+                                                  +-----------+
     |                                |                                                |                                                             |
     |                                |                                                | Start up                                                    |
     |                                |                                                |---------                                                    |
     |                                |                                                |        |                                                    |
     |                                |                                                |<--------                                                    |
     |                                |                                                |                                                             |
     |                                |                                                | Fetch data from database                                    |
     |                                |                                                |------------------------------------------------------------>|
     |                                |                                                |                                                             |
     |                                |                                                |                                                 Return data |
     |                                |                                                |<------------------------------------------------------------|
     |                                |                                                |                                                             |
     |                                |                                                | Setup event listener for websocket connections              |
     |                                |                                                |-----------------------------------------------              |
     |                                |                                                |                                              |              |
     |                                |                                                |<----------------------------------------------              |
     |                                |                                                |                                                             |
     | Connect websocket and send SYNC event                                           |                                                             |
     |-------------------------------------------------------------------------------->|                                                             |
     |                                |                                                |                                                             |
     |                                |                                                | Check if any new collections in the data and add them       |
     |                                |                                                |------------------------------------------------------       |
     |                                |                                                |                                                     |       |
     |                                |                                                |<-----------------------------------------------------       |
     |                                |                                                |                                                             |
     |                                |                                                | Upsert all data in database                                 |
     |                                |                                                |------------------------------------------------------------>|
     |                                |----------------------------------------------\ |                                                             |
     |                                || If one data entry is already                |-|                                                             |
     |                                || there with the same timestamp - store       | |                                                             |
     |                                || which server has sent it in uniqueServerIds | |                                                             |
     |                                ||---------------------------------------------| |                                   Database data has changed |
     |                                |                                                |<------------------------------------------------------------|
     |                                |                                                |                                                             |
     |                                |                                                | Generate BATCH events for all clients connected             |
     |                                |                                                |------------------------------------------------             |
     |                                |                                                |                                               |             |
     |                                |                                                |<-----------------------------------------------             |
     |                                |                                                |                                                             |
     |                                |                               Send BATCH event |                                                             |
     |<--------------------------------------------------------------------------------|                                                             |
     |                                |                                                |                                                             |
     | Persist that data locally      |                                                |                                                             |
     |--------------------------      |                                                |                                                             |
     |                         |      |                                                |                                                             |
     |<-------------------------      |                                                |                                                             |
     |                                |                                                |                                                             |
     |                                | Connect websocket and send SYNC event          |                                                             |
     |                                |----------------------------------------------->|                                                             |
     |                                |                                                |                                                             |
     |                                |                                                | Check if any new collections in the data and add them       |
     |                                |                                                |------------------------------------------------------       |
     |                                |                                                |                                                     |       |
     |                                |                                                |<-----------------------------------------------------       |
     |                                |                                                |                                                             |
     |                                |                                                | Upsert all data in database                                 |
     |                                |                                                |------------------------------------------------------------>|
     |                                |----------------------------------------------\ |                                                             |
     |                                || If one data entry is already                |-|                                                             |
     |                                || there with the same timestamp - store       | |                                                             |
     |                                || which server has sent it in uniqueServerIds | |                                                             |
     |                                ||---------------------------------------------| |                                   Database data has changed |
     |                                |                                                |<------------------------------------------------------------|
     |                                |                                                |                                                             |
     |                                |                                                | Generate BATCH events for all clients connected             |
     |                                |                                                |------------------------------------------------             |
     |                                |                                                |                                               |             |
     |                                |                                                |<-----------------------------------------------             |
     |                                |                                                |                                                             |
     |                                |                               Send BATCH event |                                                             |
     |<--------------------------------------------------------------------------------|                                                             |
     |                                |                                                |                                                             |
     | Persist that data locally      |                                                |                                                             |
     |--------------------------      |                                                |                                                             |
     |                         |      |                                                |                                                             |
     |<-------------------------      |                                                |                                                             |
     |                                |                                                |                                                             |
     |                                |                               Send BATCH event |                                                             |
     |                                |<-----------------------------------------------|                                                             |
     |                                |                                                |                                                             |
     |                                | Persist that data locally                      |                                                             |
     |                                |--------------------------                      |                                                             |
     |                                |                         |                      |                                                             |
     |                                |<-------------------------                      |                                                             |
     |                                |                                                |                                                             |
```