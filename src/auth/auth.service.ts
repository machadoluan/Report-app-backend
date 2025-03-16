import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { ProfileImageService } from 'src/profile-image/profile-image.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private readonly jwtService: JwtService,
        private readonly profileImageService: ProfileImageService,
        private readonly mailerService: MailerService
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
        const user = await this.userRepository.findOne({ where: { email: dadosLogin.email } });

        if (!user) {
            throw new BadRequestException('Usuário não registrado.');
        }

        if (!dadosLogin.email || !dadosLogin.password) {
            throw new BadRequestException('Preencha todos os campos!');
        }


        if (!user || !user.password || !(await bcrypt.compare(dadosLogin.password, user.password))) {
            throw new BadRequestException('Senha Invalida!');
        }


        const payload = this.creatPayload(user);
        const accessToken = this.jwtService.sign(payload);

        return { accessToken };
    }

    async forgotPassword(email: string) {
        const user = await this.userRepository.findOne({ where: { email: email } })

        if (!user) throw new BadRequestException('Usuário não encontrado.');

        const resetToken = this.jwtService.sign({id: user.id}, {expiresIn: '15min'});

        const resetLink = `http://localhost:4200/reset-password?token=${resetToken}`;

        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Redefinir sua senha',
            template: 'forgot-password',

            context: { name: user.name, resetLink }
        })

        return {message: 'Email enviado com sucesso!'}
    }


    async resetPassword(token: string, newPassword: string){
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.userRepository.findOne({where: {id: payload.id}});

            if(!user) throw new BadRequestException('Usúario não encontrado');

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;

            await this.userRepository.save(user)

            return {message: 'Senha redefinida com sucesso!'}
        } catch (error) {
            throw new BadRequestException('Token invalida ou expirado.')
        }
    } 

    async verifyToken(token: string){
        try {
            const payload = this.jwtService.verify(token);
        } catch (error) {
            throw new BadRequestException('Token invalida ou expirado.')
        }
    }
}
