import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Role } from '@prisma/client';
declare class ResetPasswordDto {
    password: string;
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(dto: CreateUserDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        tenantId: string | null;
        role: import(".prisma/client").$Enums.Role;
        phone: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        tenant: {
            id: string;
            name: string;
            slug: string;
        } | null;
    }>;
    findAll(query: QueryUserDto, actor: {
        role: Role;
        tenantId: string | null;
    }): Promise<{
        items: {
            id: string;
            name: string;
            createdAt: Date;
            email: string;
            tenantId: string | null;
            role: import(".prisma/client").$Enums.Role;
            phone: string | null;
            isActive: boolean;
            lastLoginAt: Date | null;
            updatedAt: Date;
            tenant: {
                id: string;
                name: string;
                slug: string;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, actor: {
        role: Role;
        tenantId: string | null;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        tenantId: string | null;
        role: import(".prisma/client").$Enums.Role;
        phone: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        tenant: {
            id: string;
            name: string;
            slug: string;
        } | null;
    }>;
    update(id: string, dto: UpdateUserDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        tenantId: string | null;
        role: import(".prisma/client").$Enums.Role;
        phone: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        updatedAt: Date;
        tenant: {
            id: string;
            name: string;
            slug: string;
        } | null;
    }>;
    remove(id: string, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        message: string;
    }>;
    resetPassword(id: string, dto: ResetPasswordDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        message: string;
    }>;
}
export {};
