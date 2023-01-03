import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    try {
      //Create password hash
      const hash = await argon.hash(dto.password);

      //Store user
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });

      return await this.generateToken(user.id, user.email);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ForbiddenException('User already exists');
        }
      }
      throw err;
    }
  }

  async signin(dto: AuthDto) {
    //Get user from DB
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    //Throw error if user does not exist
    if (!user) {
      throw new ForbiddenException('User not registered');
    }

    //Compare password
    const isSamePassword = argon.verify(user.hash, dto.password);

    //Throw error if passwords dont match
    if (!isSamePassword) {
      throw new ForbiddenException('Incorrect password');
    }

    return await this.generateToken(user.id, user.email);
  }

  async generateToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const JWT_SECRET = this.config.get('JWT_SECRET');

    const jwtToken = await this.jwtService.signAsync(payload, {
      secret: JWT_SECRET,
      expiresIn: '15min',
    });

    return {
      access_token: jwtToken,
    };
  }
}
