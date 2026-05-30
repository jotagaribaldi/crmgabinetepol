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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const regions_service_1 = require("./regions.service");
const create_region_dto_1 = require("./dto/create-region.dto");
const update_region_dto_1 = require("./dto/update-region.dto");
const query_region_dto_1 = require("./dto/query-region.dto");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
class MunicipalityIdsDto {
    municipalityIds;
}
__decorate([
    (0, swagger_2.ApiProperty)({ type: [String], description: 'Array de IDs de municípios' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], MunicipalityIdsDto.prototype, "municipalityIds", void 0);
class AssignCoordinatorDto {
    coordinatorId;
}
__decorate([
    (0, swagger_2.ApiProperty)({ description: 'UUID do coordenador (null para remover)' }),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], AssignCoordinatorDto.prototype, "coordinatorId", void 0);
let RegionsController = class RegionsController {
    regionsService;
    constructor(regionsService) {
        this.regionsService = regionsService;
    }
    create(dto, actor) {
        return this.regionsService.create(dto, {
            id: actor.sub,
            role: actor.role,
            tenantId: actor.tenantId,
        });
    }
    findAll(query, actor) {
        return this.regionsService.findAll(query, actor);
    }
    findOne(id, actor) {
        return this.regionsService.findOne(id, actor);
    }
    update(id, dto, actor) {
        return this.regionsService.update(id, dto, {
            id: actor.sub,
            role: actor.role,
            tenantId: actor.tenantId,
        });
    }
    addMunicipalities(id, dto, actor) {
        return this.regionsService.addMunicipalities(id, dto.municipalityIds, {
            id: actor.sub,
            role: actor.role,
            tenantId: actor.tenantId,
        });
    }
    removeMunicipalities(id, dto, actor) {
        return this.regionsService.removeMunicipalities(id, dto.municipalityIds, {
            id: actor.sub,
            role: actor.role,
            tenantId: actor.tenantId,
        });
    }
    assignCoordinator(id, dto, actor) {
        return this.regionsService.assignCoordinator(id, dto.coordinatorId, {
            id: actor.sub,
            role: actor.role,
            tenantId: actor.tenantId,
        });
    }
    removeCoordinator(id, actor) {
        return this.regionsService.assignCoordinator(id, null, {
            id: actor.sub,
            role: actor.role,
            tenantId: actor.tenantId,
        });
    }
    remove(id, actor) {
        return this.regionsService.remove(id, {
            id: actor.sub,
            role: actor.role,
            tenantId: actor.tenantId,
        });
    }
};
exports.RegionsController = RegionsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.CHEFEGAB, client_1.Role.ROOT),
    (0, swagger_1.ApiOperation)({ summary: 'Criar nova região (CHEFEGAB ou ROOT)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Região criada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Nome da região já existe no tenant' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_region_dto_1.CreateRegionDto, Object]),
    __metadata("design:returntype", void 0)
], RegionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar regiões (isolado por tenant para não-ROOT)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_region_dto_1.QueryRegionDto, Object]),
    __metadata("design:returntype", void 0)
], RegionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar região por ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RegionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.CHEFEGAB, client_1.Role.ROOT),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar região (inclui vincular/desvincular municípios)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_region_dto_1.UpdateRegionDto, Object]),
    __metadata("design:returntype", void 0)
], RegionsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/municipalities/add'),
    (0, roles_decorator_1.Roles)(client_1.Role.CHEFEGAB, client_1.Role.ROOT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Adicionar municípios à região' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    (0, swagger_1.ApiBody)({ type: MunicipalityIdsDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MunicipalityIdsDto, Object]),
    __metadata("design:returntype", void 0)
], RegionsController.prototype, "addMunicipalities", null);
__decorate([
    (0, common_1.Post)(':id/municipalities/remove'),
    (0, roles_decorator_1.Roles)(client_1.Role.CHEFEGAB, client_1.Role.ROOT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remover municípios da região' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    (0, swagger_1.ApiBody)({ type: MunicipalityIdsDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MunicipalityIdsDto, Object]),
    __metadata("design:returntype", void 0)
], RegionsController.prototype, "removeMunicipalities", null);
__decorate([
    (0, common_1.Post)(':id/coordinator'),
    (0, roles_decorator_1.Roles)(client_1.Role.CHEFEGAB, client_1.Role.ROOT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Atribuir coordenador à região' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    (0, swagger_1.ApiBody)({ type: AssignCoordinatorDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AssignCoordinatorDto, Object]),
    __metadata("design:returntype", void 0)
], RegionsController.prototype, "assignCoordinator", null);
__decorate([
    (0, common_1.Delete)(':id/coordinator'),
    (0, roles_decorator_1.Roles)(client_1.Role.CHEFEGAB, client_1.Role.ROOT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remover coordenador da região' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RegionsController.prototype, "removeCoordinator", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.CHEFEGAB, client_1.Role.ROOT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir região (somente sem eleitores)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RegionsController.prototype, "remove", null);
exports.RegionsController = RegionsController = __decorate([
    (0, swagger_1.ApiTags)('regions'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('regions'),
    __metadata("design:paramtypes", [regions_service_1.RegionsService])
], RegionsController);
//# sourceMappingURL=regions.controller.js.map