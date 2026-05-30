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
exports.StatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const states_service_1 = require("./states.service");
const query_state_dto_1 = require("./dto/query-state.dto");
let StatesController = class StatesController {
    statesService;
    constructor(statesService) {
        this.statesService = statesService;
    }
    findAll(query) {
        return this.statesService.findAll(query);
    }
    findOne(id) {
        return this.statesService.findOne(id);
    }
    findByAbbr(abbreviation) {
        return this.statesService.findByAbbreviation(abbreviation);
    }
};
exports.StatesController = StatesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos os estados brasileiros' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de estados' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_state_dto_1.QueryStateDto]),
    __metadata("design:returntype", void 0)
], StatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar estado por ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Estado não encontrado' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('abbr/:abbreviation'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar estado por sigla (ex: SP, RJ)' }),
    (0, swagger_1.ApiParam)({ name: 'abbreviation', type: String, example: 'SP' }),
    __param(0, (0, common_1.Param)('abbreviation')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StatesController.prototype, "findByAbbr", null);
exports.StatesController = StatesController = __decorate([
    (0, swagger_1.ApiTags)('states'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('states'),
    __metadata("design:paramtypes", [states_service_1.StatesService])
], StatesController);
//# sourceMappingURL=states.controller.js.map