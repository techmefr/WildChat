import {
  createClient,
  RedisClientType,
  RedisDefaultModules,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from 'redis';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  IMessagePostPayload,
  IMessageDeletePayload,
  IMessageGet,
  IMessageUpdatePayload,
} from '../../../common/interface/messageInterface';

@Injectable()
export class RedisService {
  private _client: RedisClientType<
    RedisDefaultModules & RedisModules,
    RedisFunctions,
    RedisScripts
  >;

  constructor() {
    createClient()
      .on('error', (err) => {
        console.error('Redis connection error:', err);
        throw new InternalServerErrorException('Failed to connect to Redis');
      })
      .connect()
      .then((client) => {
        this._client = client;
        console.log('Redis connection initialized');
      })
      .catch((err) => {
        console.error('Redis connection failed:', err);
        throw new InternalServerErrorException(
          'Failed to initialize Redis connection',
        );
      });
  }

  get client() {
    return this._client;
  }

  public async getMessages(roomId: string): Promise<IMessageGet[]> {
    try {
      const messages = await this._client.lRange(`room:${roomId}`, 0, -1);

      return messages.map((msg) => {
        const [name, message] = msg.split(' : ');
        const result = { name, message, roomId: roomId };
        console.log(typeof roomId);
        return result;
      });
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve messages from Redis',
      );
    }
  }

  public async postMessage(data: IMessagePostPayload) {
    if (data.message.length === 0) {
      throw new Error(
        'The message cannot be empty. Please enter some text before submitting.',
      );
    }
    try {
      await this.client.rPush(
        `room:${data.roomId}`,
        `${data.name} : ${data.message}`,
      );
    } catch (error) {
      console.error('Failed to post message:', error);
      throw new InternalServerErrorException('Failed to post message to Redis');
    }
  }

  public async updateMessage(
    data: IMessageUpdatePayload,
    roomId,
  ): Promise<void> {
    try {
      const currentMessages = await this._client.lRange(
        `room:${roomId}`,
        0,
        -1,
      );

      if (data.index < 0 || data.index >= currentMessages.length) {
        throw new Error('Index out of range');
      }
      if (data.message.length === 0) {
        throw new Error(
          'The message cannot be empty. Please enter some text before submitting.',
        );
      }

      const updatedMessage = `${data.name} : ${data.message}`;
      await this._client.lSet(`room:${roomId}`, data.index, updatedMessage);
    } catch (error) {
      console.error('Failed to update message:', error);
      throw new InternalServerErrorException(
        'Failed to update message in Redis',
      );
    }
  }

  public async deleteMessage(data: IMessageDeletePayload): Promise<void> {
    console.log('data : ', data);
    try {
      const currentMessages = await this._client.lRange(
        `room:${data.roomId}`,
        0,
        -1,
      );

      if (data.index < 0 || data.index >= currentMessages.length) {
        throw new Error('Index out of range');
      }

      // Replace the message to delete with a unique value
      const uniqueValue = '__DELETE__';
      await this._client.lSet(`room:${data.roomId}`, data.index, uniqueValue);

      // Remove the unique value from the list
      await this._client.lRem(`room:${data.roomId}`, 1, uniqueValue);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw new InternalServerErrorException(
        'Failed to delete message from Redis',
      );
    }
  }
  public async raiseHand(data: {
    userId: number;
    userName: string;
    type: 'self' | 'table';
    table: string;
  }) {
    const key = `raisedHands:${data.type}`;
    await this._client.hSet(
      key,
      data.userId.toString(),
      JSON.stringify({
        userName: data.userName,
        table: data.table,
        timestamp: Date.now(),
      }),
    );
  }

  public async lowerHand(data: { userId: number; type: 'self' | 'table' }) {
    const key = `raisedHands:${data.type}`;
    await this._client.hDel(key, data.userId.toString());
  }

  public async getRaisedHands() {
    const selfHands = await this._client.hGetAll('raisedHands:self');
    const tableHands = await this._client.hGetAll('raisedHands:table');

    const formatHands = (
      hands: Record<string, string>,
      type: 'self' | 'table',
    ) =>
      Object.entries(hands).map(([userId, data]) => ({
        userId: parseInt(userId),
        type,
        ...JSON.parse(data),
      }));

    return [
      ...formatHands(selfHands, 'self'),
      ...formatHands(tableHands, 'table'),
    ];
  }
}
