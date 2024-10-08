import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from 'src/entity/channel.entity';
import { User } from 'src/entity/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ['role', 'channels', 'channels.config.type'],
    });
  }

  async getUserChannels(userId: number): Promise<Channel[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['channels', 'channels.config.type'],
    });

    if (!user) throw new Error('User not found');

    const channels = user.channels.filter(
      (channel) => channel.config.type.name === 'public',
    );

    if (channels.length === 0) throw new Error('User has no public channels');

    return channels;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
  }
}
