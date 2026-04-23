import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MembersRepository } from './members.repository';
import { CreateMemberDto } from './dto/create-member.dto';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(private readonly membersRepository: MembersRepository) {}

  list(userId: string) {
    return this.membersRepository.findAllByUser(userId);
  }

  create(userId: string, dto: CreateMemberDto) {
    return this.membersRepository.create(userId, dto.name);
  }

  async remove(userId: string, id: string) {
    const member = await this.membersRepository.findByIdAndUser(id, userId);
    if (!member) throw new NotFoundException();
    return this.membersRepository.delete(id);
  }
}
