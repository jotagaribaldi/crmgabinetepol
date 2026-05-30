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
exports.CreateRegionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateRegionDto {
    name;
    stateId;
    description;
    coordinatorId;
    municipalityIds;
}
exports.CreateRegionDto = CreateRegionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Região Metropolitana de SP', description: 'Nome da região' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome é obrigatório' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateRegionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do estado ao qual a região pertence' }),
    (0, class_validator_1.IsUUID)('4', { message: 'stateId deve ser um UUID válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'stateId é obrigatório' }),
    __metadata("design:type", String)
], CreateRegionDto.prototype, "stateId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Descrição da região' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateRegionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID do coordenador (usuário com role COORDENADOR)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'coordinatorId deve ser um UUID válido' }),
    __metadata("design:type", String)
], CreateRegionDto.prototype, "coordinatorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'IDs dos municípios a vincular à região',
        type: [String],
        example: ['uuid-municipio-1', 'uuid-municipio-2'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true, message: 'Cada municipalityId deve ser um UUID válido' }),
    __metadata("design:type", Array)
], CreateRegionDto.prototype, "municipalityIds", void 0);
//# sourceMappingURL=create-region.dto.js.map