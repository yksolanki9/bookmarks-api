import { Injectable } from '@nestjs/common';

@Injectable({})
export class AuthService {
  signup() {
    return 'Sign UP route';
  }

  signin() {
    return 'Sign in route';
  }
}
