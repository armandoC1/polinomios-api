import { Module } from '@nestjs/common';
import { PolinomiosService } from './polinomios.service';
import { PolinomiosController } from './polinomios.controller';

@Module({
  controllers: [PolinomiosController],
  providers: [PolinomiosService],
})
export class PolinomiosModule {}
