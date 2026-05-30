import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { QueryMunicipalityDto } from './dto/query-municipality.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MunicipalitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryMunicipalityDto) {
    const { search, stateId, stateAbbr, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    // Resolução de stateAbbr → stateId
    let resolvedStateId = stateId;
    if (stateAbbr && !stateId) {
      const state = await this.prisma.state.findUnique({
        where: { abbreviation: stateAbbr.toUpperCase() },
        select: { id: true },
      });
      if (!state) throw new NotFoundException(`Estado '${stateAbbr}' não encontrado`);
      resolvedStateId = state.id;
    }

    const where: Prisma.MunicipalityWhereInput = {
      ...(resolvedStateId && { stateId: resolvedStateId }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.municipality.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          state: { select: { id: true, name: true, abbreviation: true } },
        },
      }),
      this.prisma.municipality.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const municipality = await this.prisma.municipality.findUnique({
      where: { id },
      include: {
        state: { select: { id: true, name: true, abbreviation: true } },
        _count: { select: { voters: true, regionLinks: true } },
      },
    });
    if (!municipality) throw new NotFoundException('Município não encontrado');
    return municipality;
  }

  async findByState(stateId: string) {
    const state = await this.prisma.state.findUnique({ where: { id: stateId } });
    if (!state) throw new NotFoundException('Estado não encontrado');

    return this.prisma.municipality.findMany({
      where: { stateId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, ibgeCode: true },
    });
  }
}
