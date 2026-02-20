import { Module } from '@nestjs/common';
import { UserApplicationModule } from './application/user.application.module';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  imports: [UserApplicationModule],
  controllers: [UserController],
})
export class UserFeatureModule {}
