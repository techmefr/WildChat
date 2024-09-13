export interface IMessagePostPayload {
  name: string;
  message: string;
  roomId: string;
}

export interface IMessageGet extends IMessagePostPayload {}

export interface IMessageUpdatePayload extends IMessagePostPayload {
  index: number;
}

export interface IMessageDeletePayload {
  roomId: number | null;
  index: number | undefined;
}
