import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { PolinomiosService } from './polinomios.service';

class OperacionPolinomiosDto {
  polinomios: string[];
}

@Controller('api/polinomios')
export class PolinomiosController {
  constructor(private readonly polinomiosService: PolinomiosService) {}

  @Post('suma')
  sumarPolinomios(@Body() dto: OperacionPolinomiosDto) {
    console.log('contro ',dto.polinomios)
    return this.polinomiosService.operarSuma(dto.polinomios);
  }

  @Post('resta')
  restarPolinomios(@Body() dto: OperacionPolinomiosDto) {
    return this.polinomiosService.operarResta(dto.polinomios);
  }

  @Post('multiplicacion')
  multiplicarPolinomios(@Body() dto: OperacionPolinomiosDto) {
    return this.polinomiosService.operarMultiplicacion(dto.polinomios);
  }

  @Post('division')
  dividirPolinomios(@Body() dto: OperacionPolinomiosDto) {
    return this.polinomiosService.operarDivision(dto.polinomios);
  }
}