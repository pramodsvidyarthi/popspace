import { RoomEvent, RoomState } from '@constants/twilio';
import { logger } from '@utils/logger';
import { EventEmitter } from 'events';
import Video, { ConnectOptions, Room, TwilioError } from 'twilio-video';

const LOG_BREADCRUMB_CATEGORY = 'twilio';
// if we encounter two errors within this timeframe, we will stop retrying
const LAST_ERROR_TOO_RECENT_MS = 5000;
export interface ReconnectingTwilioRoomEvents {
  error: (error: Error) => void;
  connecting: () => void;
  reconnecting: () => void;
  disconnected: () => void;
  connected: (room: Room) => void;
  roomChanged: (room: Room | null) => void;
}

export declare interface ReconnectingTwilioRoom {
  on<U extends keyof ReconnectingTwilioRoomEvents>(event: U, listener: ReconnectingTwilioRoomEvents[U]): this;
  emit<U extends keyof ReconnectingTwilioRoomEvents>(
    event: U,
    ...args: Parameters<ReconnectingTwilioRoomEvents[U]>
  ): boolean;
  off<U extends keyof ReconnectingTwilioRoomEvents>(event: U, listener: ReconnectingTwilioRoomEvents[U]): this;
}

export enum TwilioStatus {
  Closed = 'closed',
  Reconnecting = 'reconnecting', // also, connecting
  Disconnected = 'disconnected',
  Connected = 'connected',
}

export class ReconnectingTwilioRoom extends EventEmitter {
  private token: string | null = null;
  private _room: Room | null = null;
  private lastDisconnectErrorTime: Date | null = null;
  /** A flag for whether any current disconnection state was intentional */
  private closed = false;

  constructor(private options: ConnectOptions) {
    super();
    window.addEventListener('beforeunload', this.handleUnload);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  // WARNING: diving into Twilio client internals so we can react to low-level signaling changes
  private get peerConnection() {
    // @ts-ignore
    return this._room?._signaling?._peerConnectionManager?._peerConnections.values()?.next()?.value?._peerConnection;
  }

  get status() {
    if (this.closed && (!this._room || this._room.state === 'disconnected')) {
      return TwilioStatus.Closed;
    }
    return this._room ? (this._room.state as TwilioStatus) : TwilioStatus.Closed;
  }

  connect = async (token: string) => {
    this.emit('connecting');
    this.token = token;
    try {
      this._room = await Video.connect(token, this.options);
      this.emit('connected', this._room);
      this.emit('roomChanged', this._room);
      this._room.setMaxListeners(40);
      this._room.on(RoomEvent.Disconnected, this.handleDisconnect);
      // hacky fix for undock / sleep Chrome bug - see https://github.com/twilio/twilio-video.js/issues/1447
      this.peerConnection?.addEventListener('signalingstatechange', this.handleSignalingStateChange);

      // @ts-ignore
      window.twilioRoom = this.room;
      this.attachDebugHandlers();
      return this.room;
    } catch (err) {
      logger.critical(err);
      this.emit('disconnected');
      return null;
    }
  };

  private handleDisconnect = async (room: Room, error: TwilioError) => {
    logger.debug({
      category: LOG_BREADCRUMB_CATEGORY,
      message: 'Room disconnected',
      data: {
        roomSid: room.sid,
      },
    });
    this._room = null;
    this.emit('roomChanged', null);

    // if disconnect was caused by an error, try to reconnect once.
    if (error) {
      // avoid reconnecting loops - if there was a recent error, just fail.
      const timeSinceLastError = this.lastDisconnectErrorTime
        ? new Date().getTime() - this.lastDisconnectErrorTime.getTime()
        : Infinity;

      if (timeSinceLastError < LAST_ERROR_TOO_RECENT_MS) {
        logger.error('Too many Twilio disconnection failures in a row!');
        this.emit('disconnected');
        return;
      }

      this.lastDisconnectErrorTime = new Date();
      this.emit('reconnecting');
      try {
        if (!this.token) {
          logger.error('Cannot reconnect Twilio room if we did not connect already');
          this.emit('disconnected');
        } else {
          await this.connect(this.token);
        }
      } catch (err) {
        logger.error(err);
        this.emit('disconnected');
      }
    } else {
      this.emit('disconnected');
    }
  };

  private handleUnload = () => {
    if (this.room) {
      this.room.disconnect();
    }
  };

  private handleSignalingStateChange = () => {
    if (this.peerConnection?.signalingState === 'closed') {
      logger.debug(`Detected signaling state: closed. Rebooting media.`);
      this.reconnect();
    }
  };

  reconnect = () => {
    this.room?.disconnect();
    if (!this.token) {
      logger.error('Cannot reconnect Twilio room if we did not connect already');
      this.emit('disconnected');
      return Promise.resolve();
    } else {
      return this.connect(this.token);
    }
  };

  get room() {
    return this._room;
  }

  dispose = () => {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('beforeunload', this.handleUnload);
    this._room?.disconnect();
    this.peerConnection?.removeEventListener('signalingstatechange', this.handleSignalingStateChange);
  };

  private handleOnline = () => {
    logger.info(`Reconnected to the internet (Twilio status: ${this._room ? this._room.state : 'Idle'})`);
    // if the browser was offline and has returned, check Twilio connection state -
    // if Twilio is already reconnecting we're good, otherwise force a reconnect
    if (!this._room || this._room?.state === RoomState.Disconnected) {
      logger.info(`Reconnecting to Twilio room manually after offline`);
      this.reconnect().catch((err) => {
        logger.error(`Error reconnecting Twilio after offline`, err);
      });
    }
  };

  private handleOffline = () => {
    logger.info('Disconnected from the internet');
  };

  private attachDebugHandlers = () => {
    if (!this.room) return;
    const room = this.room;

    // @ts-ignore no 'error' event is specified in TS types, but it might happen
    room.on('error', (err) => {
      logger.error(err);
    });

    room.on(RoomEvent.ParticipantConnected, (participant) => {
      logger.debug({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Participant connected',
        data: {
          roomSid: room.sid,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      logger.debug({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Participant disconnected',
        data: {
          roomSid: room.sid,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });

    room.on(RoomEvent.ParticipantReconnected, (participant) => {
      logger.debug({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Participant reconnected',
        data: {
          roomSid: room.sid,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });

    room.on(RoomEvent.ParticipantReconnecting, (participant) => {
      logger.debug({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Participant reconnecting',
        data: {
          roomSid: room.sid,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });

    room.on(RoomEvent.Reconnected, () => {
      logger.debug({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Reconnected',
        data: {
          roomSid: room.sid,
        },
      });
    });

    room.on(RoomEvent.Reconnecting, () => {
      logger.debug({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Reconnecting',
        data: {
          roomSid: room.sid,
        },
      });
    });

    room.on(RoomEvent.TrackPublished, (pub, participant) => {
      logger.debug({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Track published',
        data: {
          roomSid: room.sid,
          trackSid: pub?.trackSid,
          trackName: pub?.trackName,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });

    room.on(RoomEvent.TrackUnpublished, (pub, participant) => {
      logger.debug({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Track unpublished',
        data: {
          roomSid: room.sid,
          trackSid: pub?.trackSid,
          trackName: pub?.trackName,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });
  };
}
