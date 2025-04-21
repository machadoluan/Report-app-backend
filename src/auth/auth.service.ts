import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { ProfileImageService } from 'src/profile-image/profile-image.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private readonly jwtService: JwtService,
        private readonly profileImageService: ProfileImageService,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
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
    async generateUniqueUsername(firstName: string, lastName: string): Promise<string> {
        let baseUsername = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, '');
        let username = baseUsername;
        let count = 1;

        // Verifica se o username já existe no banco
        while (await this.userRepository.findOne({ where: { username } })) {
            username = `${baseUsername}${count}`;
            count++;
        }

        return username;
    }


    async register(dadosRegister: any): Promise<{ accessToken: string }> {
        try {
            // ✅ Validação básica
            if (!dadosRegister.firstName || !dadosRegister.lastName || !dadosRegister.email || !dadosRegister.password) {
                throw new BadRequestException('Preencha todos os campos!');
            }

            // 🛑 Verificar se o email já existe
            const existingUser = await this.userRepository.findOne({ where: { email: dadosRegister.email } });
            if (existingUser) {
                throw new BadRequestException('Usuário já existe!');
            }

            // 🧼 Limpeza dos dados
            const firstName = dadosRegister.firstName.trim();
            const lastName = dadosRegister.lastName.trim();
            const email = dadosRegister.email.trim();
            const password = dadosRegister.password.trim();
            const fullName = `${firstName} ${lastName}`;

            // 🔒 Criptografando a senha
            const hashedPassword = await bcrypt.hash(password, 10);

            // 🖼️ Gerar imagem do perfil (proteção contra erro)
            let gerarImage;
            try {
                gerarImage = await this.profileImageService.generateProfileImage(fullName);
            } catch (error) {
                console.warn('Erro ao gerar imagem de perfil:', error);
                gerarImage = 'default-profile.png'; // imagem padrão em caso de falha
            }

            // 🎯 Criar username único
            const username = await this.generateUniqueUsername(firstName, lastName);

            // 🧩 Criar usuário
            const user = this.userRepository.create({
                name: fullName,
                email,
                username,
                password: hashedPassword,
                profileImage: gerarImage,
            });

            // 💾 Salvar no banco
            await this.userRepository.save(user);

            // 🔥 Gerar o token JWT
            const payload = this.creatPayload(user);
            const accessToken = this.jwtService.sign(payload);

            return { accessToken };
        } catch (error) {
            console.error('Erro durante o registro:', error);
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error; // Repassa o erro original pro frontend
            }
            throw new InternalServerErrorException('Falha ao registrar o usuário');
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

        const resetToken = this.jwtService.sign({ id: user.id }, { expiresIn: '15min' });

        const resetLink = `${this.configService.get<string>('URL_FRONTEND')}/reset-password?token=${resetToken}`;

        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Redefinir sua senha',
            template: 'forgot-password',

            context: { name: user.name, resetLink }
        })

        return { message: 'Email enviado com sucesso!' }
    }


    async resetPassword(token: string, newPassword: string) {
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.userRepository.findOne({ where: { id: payload.id } });

            if (!user) throw new BadRequestException('Usúario não encontrado');

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;

            await this.userRepository.save(user)

            return { message: 'Senha redefinida com sucesso!' }
        } catch (error) {
            throw new BadRequestException('Token invalida ou expirado.')
        }
    }

    async verifyToken(token: string) {
        try {
            const payload = this.jwtService.verify(token);
        } catch (error) {
            throw new BadRequestException('Token invalida ou expirado.')
        }
    }
}
