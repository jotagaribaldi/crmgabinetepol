"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VotersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const Papa = __importStar(require("papaparse"));
const XLSX = __importStar(require("xlsx"));
const voters_service_1 = require("./voters.service");
const create_voter_dto_1 = require("./dto/create-voter.dto");
const update_voter_dto_1 = require("./dto/update-voter.dto");
const query_voter_dto_1 = require("./dto/query-voter.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let VotersController = class VotersController {
    votersService;
    constructor(votersService) {
        this.votersService = votersService;
    }
    create(dto, actor) {
        return this.votersService.create(dto, { id: actor.sub, role: actor.role, tenantId: actor.tenantId });
    }
    findAll(query, actor) {
        return this.votersService.findAll(query, actor);
    }
    getStats(actor) {
        return this.votersService.getStats(actor);
    }
    findOne(id, actor) {
        return this.votersService.findOne(id, actor);
    }
    update(id, dto, actor) {
        return this.votersService.update(id, dto, { id: actor.sub, role: actor.role, tenantId: actor.tenantId });
    }
    remove(id, actor) {
        return this.votersService.remove(id, { id: actor.sub, role: actor.role, tenantId: actor.tenantId });
    }
    async importCsv(file, actor) {
        if (!file)
            throw new Error('Arquivo CSV é obrigatório');
        const csvText = file.buffer.toString('utf-8');
        const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
        });
        if (parsed.errors.length > 0) {
            return { success: false, parseErrors: parsed.errors };
        }
        return this.votersService.importCsv(parsed.data, { id: actor.sub, role: actor.role, tenantId: actor.tenantId });
    }
    async exportCsv(query, actor, res) {
        const voters = await this.votersService.exportData(query, {
            id: actor.sub,
            role: actor.role,
            tenantId: actor.tenantId,
        });
        const rows = voters.map((v) => ({
            ID: v.id,
            Nome: v.name,
            CPF: v.cpf || '',
            Telefone: v.phone || '',
            WhatsApp: v.whatsapp || '',
            Email: v.email || '',
            Nascimento: v.birthDate ? new Date(v.birthDate).toLocaleDateString('pt-BR') : '',
            Sexo: v.sex || '',
            Endereço: v.address || '',
            Bairro: v.neighborhood || '',
            CEP: v.zipCode || '',
            Município: v.municipality?.name || '',
            Região: v.region?.name || '',
            Segmento: v.segment?.name || '',
            Coordenador: v.coordinator?.name || '',
            'Líder Regional': v.regionalLeader?.name || '',
            'Líder Local': v.localLeader?.name || '',
            'Status de Apoio': v.supportStatus,
            Observações: v.observations || '',
            'Cadastrado em': new Date(v.createdAt).toLocaleDateString('pt-BR'),
        }));
        const csv = Papa.unparse(rows);
        const filename = `eleitores_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send('\uFEFF' + csv);
    }
    async exportXlsx(query, actor, res) {
        const voters = await this.votersService.exportData(query, {
            id: actor.sub,
            role: actor.role,
            tenantId: actor.tenantId,
        });
        const rows = voters.map((v) => ({
            ID: v.id,
            Nome: v.name,
            CPF: v.cpf || '',
            Telefone: v.phone || '',
            WhatsApp: v.whatsapp || '',
            Email: v.email || '',
            Nascimento: v.birthDate ? new Date(v.birthDate).toLocaleDateString('pt-BR') : '',
            Sexo: v.sex || '',
            Município: v.municipality?.name || '',
            Região: v.region?.name || '',
            Segmento: v.segment?.name || '',
            'Status Apoio': v.supportStatus,
            Coordenador: v.coordinator?.name || '',
            'Líder Regional': v.regionalLeader?.name || '',
            'Líder Local': v.localLeader?.name || '',
            Observações: v.observations || '',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Eleitores');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const filename = `eleitores_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
};
exports.VotersController = VotersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.LIDERLOCAL, client_1.Role.LIDERREG, client_1.Role.COORDENADOR, client_1.Role.CHEFEGAB, client_1.Role.POLITICO, client_1.Role.ROOT),
    (0, swagger_1.ApiOperation)({ summary: 'Cadastrar eleitor' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Eleitor cadastrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'CPF/Telefone/WhatsApp duplicado no tenant' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_voter_dto_1.CreateVoterDto, Object]),
    __metadata("design:returntype", void 0)
], VotersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Busca avançada de eleitores com paginação server-side' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_voter_dto_1.QueryVoterDto, Object]),
    __metadata("design:returntype", void 0)
], VotersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(client_1.Role.POLITICO, client_1.Role.CHEFEGAB, client_1.Role.COORDENADOR, client_1.Role.ROOT),
    (0, swagger_1.ApiOperation)({ summary: 'Estatísticas de eleitores por segmento, município, região e suporte' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VotersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar eleitor por ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VotersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar eleitor' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_voter_dto_1.UpdateVoterDto, Object]),
    __metadata("design:returntype", void 0)
], VotersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.CHEFEGAB, client_1.Role.POLITICO, client_1.Role.ROOT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir eleitor' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VotersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('import/csv'),
    (0, roles_decorator_1.Roles)(client_1.Role.CHEFEGAB, client_1.Role.POLITICO, client_1.Role.ROOT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Importar eleitores via CSV',
        description: `Colunas suportadas: nome, telefone, whatsapp, email, cpf, data_nascimento, endereco, bairro, cep, observacoes`,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resultado da importação com erros por linha' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VotersController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Get)('export/csv'),
    (0, roles_decorator_1.Roles)(client_1.Role.CHEFEGAB, client_1.Role.POLITICO, client_1.Role.COORDENADOR, client_1.Role.ROOT),
    (0, swagger_1.ApiOperation)({ summary: 'Exportar eleitores filtrados como CSV' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_voter_dto_1.QueryVoterDto, Object, Object]),
    __metadata("design:returntype", Promise)
], VotersController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Get)('export/xlsx'),
    (0, roles_decorator_1.Roles)(client_1.Role.CHEFEGAB, client_1.Role.POLITICO, client_1.Role.COORDENADOR, client_1.Role.ROOT),
    (0, swagger_1.ApiOperation)({ summary: 'Exportar eleitores filtrados como XLSX (Excel)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_voter_dto_1.QueryVoterDto, Object, Object]),
    __metadata("design:returntype", Promise)
], VotersController.prototype, "exportXlsx", null);
exports.VotersController = VotersController = __decorate([
    (0, swagger_1.ApiTags)('voters'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('voters'),
    __metadata("design:paramtypes", [voters_service_1.VotersService])
], VotersController);
//# sourceMappingURL=voters.controller.js.map