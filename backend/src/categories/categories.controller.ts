import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/jwt-user.interface';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista categorias do usuário. Filtre por ?type=INCOME|EXPENSE' })
  list(@CurrentUser() user: JwtUser, @Query('type') type?: string) {
    return this.categories.list(user.id, type);
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma nova categoria' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateCategoryDto) {
    return this.categories.create(user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma categoria' })
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.categories.remove(user.id, id);
  }
}
