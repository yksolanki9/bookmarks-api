import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}

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

      //This will only delete the hash field from the user object. Nothing changes in DB.
      delete user.hash;

      //Send user
      return user;
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

    //Return user
    delete user.hash;
    return user;
  }
}
