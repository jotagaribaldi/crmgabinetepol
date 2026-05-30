"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MunicipalitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
let MunicipalitiesService = class MunicipalitiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const { search, stateId, stateAbbr, page = 1, limit = 50 } = query;
        const skip = (page - 1) * limit;
        let resolvedStateId = stateId;
        if (stateAbbr && !stateId) {
            const state = await this.prisma.state.findUnique({
                where: { abbreviation: stateAbbr.toUpperCase() },
                select: { id: true },
            });
            if (!state)
                throw new common_1.NotFoundException(`Estado '${stateAbbr}' não encontrado`);
            resolvedStateId = state.id;
        }
        const where = {
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
    async findOne(id) {
        const municipality = await this.prisma.municipality.findUnique({
            where: { id },
            include: {
                state: { select: { id: true, name: true, abbreviation: true } },
                _count: { select: { voters: true, regionLinks: true } },
            },
        });
        if (!municipality)
            throw new common_1.NotFoundException('Município não encontrado');
        return municipality;
    }
    async findByState(stateId) {
        const state = await this.prisma.state.findUnique({ where: { id: stateId } });
        if (!state)
            throw new common_1.NotFoundException('Estado não encontrado');
        return this.prisma.municipality.findMany({
            where: { stateId },
            orderBy: { name: 'asc' },
            select: { id: true, name: true, ibgeCode: true },
        });
    }
};
exports.MunicipalitiesService = MunicipalitiesService;
exports.MunicipalitiesService = MunicipalitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MunicipalitiesService);
//# sourceMappingURL=municipalities.service.js.map