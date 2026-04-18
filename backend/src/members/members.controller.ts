import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/jwt-user.interface';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private members: MembersService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.members.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateMemberDto) {
    return this.members.create(user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.members.remove(user.id, id);
  }
}
