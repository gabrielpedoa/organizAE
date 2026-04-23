import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CategoryType } from '@prisma/client';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  list(userId: string, type?: string) {
    return this.categoriesRepository.findAllByUser(userId, type as CategoryType);
  }

  create(userId: string, dto: CreateCategoryDto) {
    return this.categoriesRepository.create(userId, dto);
  }

  async remove(userId: string, id: string) {
    const cat = await this.categoriesRepository.findByIdAndUser(id, userId);
    if (!cat) throw new NotFoundException();
    return this.categoriesRepository.delete(id);
  }
}
