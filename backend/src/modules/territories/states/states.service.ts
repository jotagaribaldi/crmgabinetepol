import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { QueryStateDto } from './dto/query-state.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryStateDto) {
    const { search, page = 1, limit = 30 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StateWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { abbreviation: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.state.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { municipalities: true } },
        },
      }),
      this.prisma.state.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const state = await this.prisma.state.findUnique({
      where: { id },
      include: {
        _count: { select: { municipalities: true, regions: true } },
      },
    });
    if (!state) throw new NotFoundException('Estado não encontrado');
    return state;
  }

  async findByAbbreviation(abbreviation: string) {
    const state = await this.prisma.state.findUnique({
      where: { abbreviation: abbreviation.toUpperCase() },
    });
    if (!state) throw new NotFoundException(`Estado '${abbreviation}' não encontrado`);
    return state;
  }
}
