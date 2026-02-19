import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  providers: [UserService],
  exports: [UserService],
})
export class ApplicationModule {}
