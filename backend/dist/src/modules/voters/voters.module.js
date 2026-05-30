"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VotersModule = void 0;
const common_1 = require("@nestjs/common");
const voters_service_1 = require("./voters.service");
const voters_controller_1 = require("./voters.controller");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
let VotersModule = class VotersModule {
};
exports.VotersModule = VotersModule;
exports.VotersModule = VotersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.memoryStorage)(),
                limits: { fileSize: 10 * 1024 * 1024 },
                fileFilter: (_req, file, cb) => {
                    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
                        cb(null, true);
                    }
                    else {
                        cb(new Error('Apenas arquivos CSV são permitidos'), false);
                    }
                },
            }),
        ],
        controllers: [voters_controller_1.VotersController],
        providers: [voters_service_1.VotersService],
        exports: [voters_service_1.VotersService],
    })
], VotersModule);
//# sourceMappingURL=voters.module.js.map