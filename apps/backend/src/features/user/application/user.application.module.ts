import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserInfrastructureModule } from '../infrastructure/user.infrastructure.module';

@Module({
  imports: [UserInfrastructureModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserApplicationModule {}
