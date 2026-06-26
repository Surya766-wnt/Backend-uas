import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import { User } from './users/entities/user.entity';
import { Post } from './posts/entities/post.entity';
import { Category } from './categories/entities/category.entity';
import { Comment } from './comments/entities/comment.entity';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH || 'database.sqlite',
      entities: [User, Post, Category, Comment],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    PostsModule,
    CategoriesModule,
    CommentsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
