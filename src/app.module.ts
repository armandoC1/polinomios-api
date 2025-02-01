import { Module } from '@nestjs/common';
import { PolinomiosModule } from './polinomios/polinomios.module';

@Module({
  imports: [PolinomiosModule],
})
export class AppModule {}
