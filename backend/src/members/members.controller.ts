import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtUser } from "../auth/jwt-user.interface";
import { CreateMemberDto } from "./dto/create-member.dto";
import { MembersService } from "./members.service";

@ApiTags("members")
@ApiBearerAuth()
@Controller("members")
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private members: MembersService) {}

  @Get()
  @ApiOperation({ summary: "Lista todos os membros do usuário autenticado" })
  list(@CurrentUser() user: JwtUser) {
    return this.members.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: "Cria um novo membro" })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateMemberDto) {
    return this.members.create(user.id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove um membro" })
  remove(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.members.remove(user.id, id);
  }
}
