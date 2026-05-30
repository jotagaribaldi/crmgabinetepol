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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("./dashboard.service");
const dashboard_filter_dto_1 = require("./dto/dashboard-filter.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let DashboardController = class DashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getRootDashboard(filter) {
        return this.dashboardService.getRootDashboard(filter);
    }
    getTenantDashboard(filter, actor) {
        return this.dashboardService.getTenantDashboard(filter, actor);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('root'),
    (0, roles_decorator_1.Roles)(client_1.Role.ROOT),
    (0, swagger_1.ApiOperation)({
        summary: 'Dashboard ROOT — visão global do sistema (todos os tenants)',
        description: 'Retorna totais globais, crescimento, distribuição por estado/partido, top tenants e atividade recente.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dados do dashboard ROOT' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_filter_dto_1.DashboardFilterDto]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getRootDashboard", null);
__decorate([
    (0, common_1.Get)('tenant'),
    (0, roles_decorator_1.Roles)(client_1.Role.POLITICO, client_1.Role.CHEFEGAB, client_1.Role.COORDENADOR),
    (0, swagger_1.ApiOperation)({
        summary: 'Dashboard do candidato (tenant) — visão do eleitorado',
        description: 'Retorna totais, crescimento diário (30 dias), eleitores por segmento, região, município, sexo e status de apoio, top líderes e últimos cadastros.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dados do dashboard do candidato' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_filter_dto_1.DashboardFilterDto, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getTenantDashboard", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('dashboard'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map