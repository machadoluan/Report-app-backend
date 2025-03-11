import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { ProfileImageService } from 'src/profile-image/profile-image.service';

@Injectable()
export class AuthService {    
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private readonly jwtService: JwtService,
        private readonly profileImageService: ProfileImageService
    ) { }

    private creatPayload(user: UserEntity) {
        return {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            photo: user.profileImage
        }
    }

    async register(name: string, username: string, email: string, password: string): Promise<{ accessToken: string }> {
        try {
            if (!name || !username || !email || !password) {
                throw new BadRequestException('Preencha todos os campos!');
            }

            const existingUser = await this.userRepository.findOne({ where: { email, username } });
            if (existingUser) {
                throw new UnauthorizedException('Usuário ja existe!');
            }

            const hashedPassword = await bcrypt.hash(password, 10)
            const gerarImage = await this.profileImageService.generateProfileImage(name)

            const user = this.userRepository.create({
                name,
                username,
                email,
                password: hashedPassword,
                profileImage: gerarImage
            });

            await this.userRepository.save(user)

            const payload = this.creatPayload(user);
            const accessToken = this.jwtService.sign(payload)

            return { accessToken }
        } catch (error) {
            console.error('Erro durante o registro:', error);
            throw new InternalServerErrorException('Failed to register user');
        }
    }


    async login(dadosLogin: any): Promise<{ accessToken: string }> {
        const user = await this.userRepository.findOne({ where: { username: dadosLogin.username } });

        if (!user) {
            throw new BadRequestException('Usuário não registrado.');
        }

        if (!dadosLogin.username || !dadosLogin.password) {
            throw new BadRequestException('Preencha todos os campos!');
        }


        if (!user || !user.password || !(await bcrypt.compare(dadosLogin.password, user.password))) { 
            throw new BadRequestException('Credencias invalidas');
        }


        const payload = this.creatPayload(user);
        const accessToken = this.jwtService.sign(payload);

        return { accessToken };
    }
}
