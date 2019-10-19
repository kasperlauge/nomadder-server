import { Server } from 'ws';
import { EventTypes, INomadderEvent, NOMADDER_PROTOCOL } from './models/nomadder-event.model';

export function setup(config: IConfig) {
  const wss = config.websocket;
  wss.addListener('connection', ws => {
    ws.addListener('message', message => {
      // Parse message data
      let msg = null;
      try {
        msg = JSON.parse(message as string) as INomadderEvent;
      } catch {
        // If it is not JSON it has nothing to do with this protocol
        return;
      }
      // Ensure right protocol
      if (msg.protocol !== NOMADDER_PROTOCOL) {
        return;
      }

      switch (msg.event) {
        case EventTypes.SYNC:
          /*tslint:disable-next-line:no-console*/
          console.debug('[SYNC event sent with payload]: ', msg.payload);
          break;
        default:
          /*tslint:disable-next-line:no-console*/
          console.error('[Unknown event type]: ', msg.event);
          break;
      }
    });
  });

  return true;
}

export interface IConfig {
  websocket: Server;
}
