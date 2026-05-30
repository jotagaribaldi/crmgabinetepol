import { CreateSegmentDto } from './create-segment.dto';
declare const UpdateSegmentDto_base: import("@nestjs/common").Type<Partial<CreateSegmentDto>>;
export declare class UpdateSegmentDto extends UpdateSegmentDto_base {
    isActive?: boolean;
}
export {};
