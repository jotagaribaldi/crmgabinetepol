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
exports.MunicipalitiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const municipalities_service_1 = require("./municipalities.service");
const query_municipality_dto_1 = require("./dto/query-municipality.dto");
let MunicipalitiesController = class MunicipalitiesController {
    municipalitiesService;
    constructor(municipalitiesService) {
        this.municipalitiesService = municipalitiesService;
    }
    findAll(query) {
        return this.municipalitiesService.findAll(query);
    }
    findOne(id) {
        return this.municipalitiesService.findOne(id);
    }
    findByState(stateId) {
        return this.municipalitiesService.findByState(stateId);
    }
};
exports.MunicipalitiesController = MunicipalitiesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar municípios com paginação — filtrar por estado (stateId ou stateAbbr)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de municípios' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_municipality_dto_1.QueryMunicipalityDto]),
    __metadata("design:returntype", void 0)
], MunicipalitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar município por ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Município não encontrado' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MunicipalitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('state/:stateId/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos os municípios de um estado (sem paginação, para selects)' }),
    (0, swagger_1.ApiParam)({ name: 'stateId', type: String, format: 'uuid' }),
    __param(0, (0, common_1.Param)('stateId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MunicipalitiesController.prototype, "findByState", null);
exports.MunicipalitiesController = MunicipalitiesController = __decorate([
    (0, swagger_1.ApiTags)('municipalities'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('municipalities'),
    __metadata("design:paramtypes", [municipalities_service_1.MunicipalitiesService])
], MunicipalitiesController);
//# sourceMappingURL=municipalities.controller.js.map