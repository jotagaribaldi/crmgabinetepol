import { CreateVoterDto } from './create-voter.dto';
declare const UpdateVoterDto_base: import("@nestjs/common").Type<Partial<CreateVoterDto>>;
export declare class UpdateVoterDto extends UpdateVoterDto_base {
    isActive?: boolean;
}
export {};
