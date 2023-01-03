import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(async () => await app.close());

  describe('Auth', () => {
    let dto: AuthDto = {
      email: 'testuser@gmail.com',
      password: 'testuser',
    };

    describe('Sign up user', () => {
      it('should return error if body is empty', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });

      it('should return error if email is not present', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should return error if password is not present', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Sign in user', () => {
      it('should return error if body is empty', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });

      it('should return error if email is not present', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should return error if password is not present', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('accessToken', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      const dto: EditUserDto = {
        email: 'chandankumarsharma@gmail.com',
        firstName: 'chandan',
      };
      it('should return success status code', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .withBody(dto)
          .expectStatus(200);
      });

      it('should update the user details', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .withBody(dto)
          .expectJsonLike(dto);
      });
    });
  });

  describe('Bookmark', () => {
    const dto: CreateBookmarkDto = {
      title: 'Some awesome bookmark',
      link: 'https://google.com',
    };
    describe('Create Bookmark', () => {
      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmark')
          .withBody(dto)
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get all Bookmarks', () => {
      it('should get all bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmark')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(200)
          .expectJsonLength(1)
          .expectJsonLike([dto]);
      });
    });

    describe('Get bookmark by Id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(200)
          .expectJsonLike(dto);
      });
    });

    describe('Edit bookmark', () => {
      const dto: EditBookmarkDto = {
        title: 'New title',
        description: 'Added a description',
      };
      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectJsonLike(dto);
      });
    });

    describe('Delete bookmark', () => {
      it('should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{accessToken}',
          })
          .expectStatus(200);
      });
    });
  });
});
