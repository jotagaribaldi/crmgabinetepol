import { Module } from '@nestjs/common';
import { StatesService } from './states/states.service';
import { StatesController } from './states/states.controller';
import { MunicipalitiesService } from './municipalities/municipalities.service';
import { MunicipalitiesController } from './municipalities/municipalities.controller';
import { RegionsService } from './regions/regions.service';
import { RegionsController } from './regions/regions.controller';

@Module({
  controllers: [StatesController, MunicipalitiesController, RegionsController],
  providers: [StatesService, MunicipalitiesService, RegionsService],
  exports: [StatesService, MunicipalitiesService, RegionsService],
})
export class TerritoriesModule {}
