import { Injectable } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { UserService } from './user.service';
import { RedisService } from './redis.service';

@Injectable()
export class StudentService {
  constructor(
    private userService: UserService,
    private redisService: RedisService,
  ) {}

  async getAllStudents(): Promise<User[]> {
    const allUsers = await this.userService.findAll();
    return allUsers.filter((user) => user.role && user.role.name === 'eleve');
  }

  async getStudentById(id: number): Promise<User | undefined> {
    const user = await this.userService.getUserById(id);
    if (user && user.role && user.role.name === 'eleve') {
      return user;
    }
    return undefined;
  }

  async updateStudentStatus(id: number, online: boolean): Promise<void> {
    const user = await this.getStudentById(id);
    if (user) {
      await this.redisService.setUserPresence(
        id,
        online ? 'online' : 'offline',
      );
    }
  }

  async getOnlineStudents(): Promise<User[]> {
    const allStudents = await this.getAllStudents();
    const presences = await this.redisService.getAllUserPresences();
    return allStudents.filter(
      (student) => presences[student.id.toString()] === 'online',
    );
  }

  async getOfflineStudents(): Promise<User[]> {
    const allStudents = await this.getAllStudents();
    const presences = await this.redisService.getAllUserPresences();
    return allStudents.filter(
      (student) => presences[student.id.toString()] !== 'online',
    );
  }
}
