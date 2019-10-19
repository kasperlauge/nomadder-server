import { Server } from "ws";
import { NomadderEvent, NOMADDER_PROTOCOL, EventTypes } from "./models/nomadder-event.model";

export function setup(config: IConfig) {
    const wss = config.websocket;
    wss.addListener("connection", (ws) => {
        ws.addListener("message", (message) => {
            // Parse message data
            const msg = JSON.parse(message as string) as NomadderEvent;
            // Ensure right protocol
            if (msg.protocol === NOMADDER_PROTOCOL) {
                switch (msg.event) {
                    case EventTypes.SYNC:
                        console.debug("[SYNC event sent with payload]: ", msg.payload);
                        break;
                    default:
                        console.error("[Unknown event type]: ", msg.event);
                        break;
                }
            }
        });
      });
      
  return true;
}

export interface IConfig {
  websocket: Server;
}
