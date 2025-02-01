import { Injectable } from '@nestjs/common';

interface Fraccion {
    numerador: number;
    denominador: number;
}

interface TerminoNormalizado {
    coeficiente: Fraccion;
    variable: string;
}

@Injectable()
export class PolinomiosService {
    private separarTerminos(polinomio: string): string[] {
        const polinomioNormalizado = polinomio.charAt(0) === '-' ? polinomio : '+' + polinomio;
        const terminos = polinomioNormalizado.match(/[+-][^+-]+/g) || [];
        const terminosLimpios = terminos.map(t => t.trim().replace(/\s+/g, ''));
        console.log('🔹 Términos separados:', terminosLimpios);
        return terminosLimpios;
    }

    private simplificarFraccion(fraccion: Fraccion): Fraccion {
        const mcd = this.calcularMCD(Math.abs(fraccion.numerador), Math.abs(fraccion.denominador));
        const signo = (fraccion.numerador * fraccion.denominador) >= 0 ? 1 : -1;
        return {
            numerador: signo * Math.abs(fraccion.numerador) / mcd,
            denominador: Math.abs(fraccion.denominador) / mcd
        };
    }

    private stringAFraccion(str: string): Fraccion {
        if (str === '') return { numerador: 1, denominador: 1 };
        if (str === '-') return { numerador: -1, denominador: 1 };

        const partes = str.split('/');
        if (partes.length === 1) {
            return { numerador: parseInt(partes[0]), denominador: 1 };
        }
        return {
            numerador: parseInt(partes[0]),
            denominador: parseInt(partes[1])
        };
    }
    private normalizarTermino(termino: string): TerminoNormalizado {
        console.log('🔹 Normalizando término:', termino);
        let term = termino.trim().replace(/\s+/g, '');
        const signo = term.startsWith('-') ? -1 : 1;
        term = term.replace(/^[+-]/, '');

        const partes = term.match(/^(?:(\d+\/\d+|\d+)?(?:([a-z])(?:\^(\d+))?)?|([a-z])(?:\^(\d+))?)?$/);
        if (!partes) throw new Error(`Término inválido: ${termino}`);

        let coef = '1';
        let variable = '';
        let exponente = '';

        if (partes[1]) {
            coef = partes[1];
        }
        if (partes[2]) {
            variable = partes[2];
            exponente = partes[3] || '1';
        } else if (partes[4]) {
            variable = partes[4];
            exponente = partes[5] || '1';
        }

        const fraccion = this.stringAFraccion(coef);
        fraccion.numerador *= signo;

        const variableFinal = variable ? (exponente === '1' ? variable : `${variable}^${exponente}`) : '';

        console.log('✅ Término normalizado:', { coeficiente: fraccion, variable: variableFinal });
        return {
            coeficiente: this.simplificarFraccion(fraccion),
            variable: variableFinal
        };
    }

    private multiplicarFracciones(f1: Fraccion, f2: Fraccion): Fraccion {
        return this.simplificarFraccion({
            numerador: f1.numerador * f2.numerador,
            denominador: f1.denominador * f2.denominador
        });
    }

    private dividirFracciones(f1: Fraccion, f2: Fraccion): Fraccion {
        if (f2.numerador === 0) throw new Error('División por cero');
        return this.simplificarFraccion({
            numerador: f1.numerador * f2.denominador,
            denominador: f1.denominador * f2.numerador
        });
    }

    private sumarFracciones(f1: Fraccion, f2: Fraccion): Fraccion {
        const nuevoDenominador = this.calcularMCM(f1.denominador, f2.denominador);
        const nuevoNumerador =
            f1.numerador * (nuevoDenominador / f1.denominador) +
            f2.numerador * (nuevoDenominador / f2.denominador);

        return this.simplificarFraccion({
            numerador: nuevoNumerador,
            denominador: nuevoDenominador
        });
    }

    private calcularMCD(a: number, b: number): number {
        return b === 0 ? a : this.calcularMCD(b, a % b);
    }

    private calcularMCM(a: number, b: number): number {
        return Math.abs(a * b) / this.calcularMCD(a, b);
    }

    private fraccionAString(fraccion: Fraccion): string {
        if (fraccion.denominador === 1) return fraccion.numerador.toString();
        return `${fraccion.numerador}/${fraccion.denominador}`;
    }

    private obtenerGrado(variable: string): number {
        const exponente = variable.match(/\^(\d+)/);
        if (exponente) return parseInt(exponente[1]);
        return variable.includes('x') ? 1 : 0;
    }

    private multiplicarTerminos(t1: TerminoNormalizado, t2: TerminoNormalizado): TerminoNormalizado {
        const coeficiente = this.multiplicarFracciones(t1.coeficiente, t2.coeficiente);

        let variable = '';
        if (t1.variable || t2.variable) {
            const grado1 = this.obtenerGrado(t1.variable);
            const grado2 = this.obtenerGrado(t2.variable);
            const gradoTotal = grado1 + grado2;

            if (gradoTotal > 0) {
                variable = gradoTotal === 1 ? 'x' : `x^${gradoTotal}`;
            }
        }

        return { coeficiente, variable };
    }

    private combinarTerminosSimilares(terminos: TerminoNormalizado[]): Map<string, Fraccion> {
        const terminosCombinados = new Map<string, Fraccion>();

        terminos.forEach(({ coeficiente, variable }) => {
            const valorActual = terminosCombinados.get(variable) || { numerador: 0, denominador: 1 };
            terminosCombinados.set(
                variable,
                this.sumarFracciones(valorActual, coeficiente)
            );
        });

        return terminosCombinados;
    }

    private ordenarTerminos(terminos: Map<string, Fraccion>): string {
        return Array.from(terminos.entries())
            .sort((a, b) => this.obtenerGrado(b[0]) - this.obtenerGrado(a[0]))
            .map(([variable, coef]) => {
                if (coef.numerador === 0) return '';

                const coefStr = this.fraccionAString(coef);
                if (variable === '') return coefStr;
                if (coefStr === '1' && variable !== '') return variable;
                if (coefStr === '-1' && variable !== '') return '-' + variable;
                return coefStr + variable;
            })
            .filter(term => term !== '')
            .map((term, i) => {
                if (i === 0 && term.startsWith('+')) return term.slice(1);
                if (!term.startsWith('-')) return (i === 0 ? '' : '+') + term;
                return term;
            })
            .join('') || '0';
    }

    operarSuma(polinomios: string[]): { resultado: string, explicacion: string } | { error: string } {
        try {
            if (!polinomios || polinomios.length === 0) {
                throw new Error('No se proporcionaron polinomios');
            }
    
            console.log('🔹 Polinomios recibidos para suma:', polinomios);
    
            // 1️⃣ Separar términos individuales y normalizarlos
            const terminosNormalizados = polinomios
                .flatMap(p => this.separarTerminos(p))
                .map(t => this.normalizarTermino(t));
    
            console.log('✅ Términos normalizados:', terminosNormalizados);
    
            // 2️⃣ Agrupar términos semejantes
            const terminosCombinados = this.combinarTerminosSimilares(terminosNormalizados);
            console.log('✅ Términos combinados:', terminosCombinados);
    
            // 3️⃣ Construir una explicación detallada
            let explicacion = `Se sumaron los términos semejantes de los polinomios:\n\n`;
    
            // Guardar cada paso de la suma en la explicación
            terminosCombinados.forEach((coef, variable) => {
                const terminosOriginales = terminosNormalizados
                    .filter(t => t.variable === variable)
                    .map(t => this.fraccionAString(t.coeficiente));
    
                const sumaExplicada = terminosOriginales.join(' + ');
                const resultadoSimplificado = this.fraccionAString(coef);
                const nombreTermino = variable === "" ? "constante" : variable;
    
                explicacion += `🔹 Para el término **${nombreTermino}**:\n`;
                explicacion += `   ➤ Se sumaron: **${sumaExplicada}**, que son los coeficientes de **${nombreTermino}**\n`;
                explicacion += `   ➤ Resultado: **${resultadoSimplificado} ${nombreTermino}**\n\n`;
            });
    
            // 4️⃣ Ordenar términos y construir resultado final
            const resultadoFinal = this.ordenarTerminos(terminosCombinados);
            console.log('✅ Resultado final:', resultadoFinal);
    
            return {
                resultado: resultadoFinal,
                explicacion
            };
    
        } catch (error) {
            return { error: `Error en la suma: ${error.message}` };
        }
    }    
    

    operarResta(polinomios: string[]): { resultado: string, explicacion: string } | { error: string } {
        try {
            if (!polinomios || polinomios.length < 2) {
                throw new Error('Se requieren al menos dos polinomios');
            }
    
            console.log('🔹 Polinomios recibidos para resta:', polinomios);
    
            // 1️⃣ Normalizar términos del primer polinomio
            const terminosP1 = this.separarTerminos(polinomios[0]).map(t => this.normalizarTermino(t));
    
            console.log('✅ Términos normalizados del primer polinomio:', terminosP1);
    
            // 2️⃣ Negar los coeficientes de los polinomios restantes
            const terminosRestantes = polinomios.slice(1).flatMap(p => {
                console.log('🔹 Procesando polinomio para negación:', p);
                return this.separarTerminos(p).map(t => {
                    const termino = this.normalizarTermino(t);
                    termino.coeficiente.numerador *= -1; // Negar el coeficiente
                    console.log(`🔹 Término negado: ${t} ->`, termino);
                    return termino;
                });
            });
    
            // 3️⃣ Combinar los términos del primer polinomio con los términos negados
            const terminosCombinados = [...terminosP1, ...terminosRestantes];
            console.log('✅ Términos combinados después de negación:', terminosCombinados);
    
            // 4️⃣ Agrupar términos semejantes
            const terminosAgrupados = this.combinarTerminosSimilares(terminosCombinados);
            console.log('✅ Términos agrupados:', terminosAgrupados);
    
            // 5️⃣ Construir una explicación detallada
            let explicacion = `Se realizó la resta de los polinomios:\n\n`;
    
            terminosAgrupados.forEach((coef, variable) => {
                const terminosOriginales = terminosCombinados
                    .filter(t => t.variable === variable)
                    .map(t => this.fraccionAString(t.coeficiente));
    
                const restaExplicada = terminosOriginales.join(' + ');
                const resultadoSimplificado = this.fraccionAString(coef);
                const nombreTermino = variable === "" ? "constante" : variable;
    
                explicacion += `🔹 Para el término **${nombreTermino}**:\n`;
                explicacion += `   ➤ Se restaron: **${restaExplicada}**, que son los coeficientes de **${nombreTermino}**\n`;
                explicacion += `   ➤ Resultado: **${resultadoSimplificado} ${nombreTermino}**\n\n`;
            });
    
            // 6️⃣ Ordenar términos y construir resultado final
            const resultadoFinal = this.ordenarTerminos(terminosAgrupados);
            console.log('✅ Resultado final:', resultadoFinal);
    
            return {
                resultado: resultadoFinal,
                explicacion
            };
    
        } catch (error) {
            return { error: `Error en la resta: ${error.message}` };
        }
    }
    operarMultiplicacion(polinomios: string[]): { resultado: string, explicacion: string } | { error: string } {
        try {
            if (!polinomios || polinomios.length < 2) {
                throw new Error('Se requieren al menos dos polinomios');
            }
    
            let resultado = this.separarTerminos(polinomios[0])
                .map(t => this.normalizarTermino(t));
    
            let explicacion = `Se multiplicaron los polinomios aplicando la propiedad distributiva:\n\n`;
    
            for (let i = 1; i < polinomios.length; i++) {
                const terminosActuales = this.separarTerminos(polinomios[i])
                    .map(t => this.normalizarTermino(t));
    
                const nuevosTerminos: TerminoNormalizado[] = [];
    
                resultado.forEach(t1 => {
                    terminosActuales.forEach(t2 => {
                        const terminoMultiplicado = this.multiplicarTerminos(t1, t2);
                        nuevosTerminos.push(terminoMultiplicado);
    
                        explicacion += `🔹 Multiplicación de **(${this.fraccionAString(t1.coeficiente)}${t1.variable})** × **(${this.fraccionAString(t2.coeficiente)}${t2.variable})**\n`;
                        explicacion += `   ➤ Coeficientes multiplicados: ${this.fraccionAString(t1.coeficiente)} × ${this.fraccionAString(t2.coeficiente)}\n`;
                        explicacion += `   ➤ Variables multiplicadas: ${t1.variable || '1'} × ${t2.variable || '1'}\n`;
                        explicacion += `   ➤ Resultado: **${this.fraccionAString(terminoMultiplicado.coeficiente)}${terminoMultiplicado.variable}**\n\n`;
                    });
                });
    
                resultado = nuevosTerminos;
            }
    
            const terminosCombinados = this.combinarTerminosSimilares(resultado);
            const resultadoFinal = this.ordenarTerminos(terminosCombinados);
    
            return {
                resultado: resultadoFinal,
                explicacion
            };
        } catch (error) {
            return { error: `Error en la multiplicación: ${error.message}` };
        }
    }
    
    operarDivision(polinomios: string[]): { resultado: string, explicacion: string } | { error: string } {
        try {
            if (!polinomios || polinomios.length !== 2) {
                throw new Error('Se requieren exactamente dos polinomios');
            }
    
            const dividendo = this.separarTerminos(polinomios[0])
                .map(t => this.normalizarTermino(t));
            const divisor = this.separarTerminos(polinomios[1])
                .map(t => this.normalizarTermino(t));
    
            if (divisor.length === 0 || (divisor.length === 1 && divisor[0].coeficiente.numerador === 0)) {
                throw new Error('División por cero');
            }
    
            if (dividendo.length !== 1 || divisor.length !== 1) {
                throw new Error('Solo se soporta división de términos similares por ahora');
            }
    
            const resultado = {
                coeficiente: this.dividirFracciones(dividendo[0].coeficiente, divisor[0].coeficiente),
                variable: ''
            };
    
            const gradoDividendo = this.obtenerGrado(dividendo[0].variable);
            const gradoDivisor = this.obtenerGrado(divisor[0].variable);
            const gradoResultado = gradoDividendo - gradoDivisor;
    
            if (gradoResultado > 0) {
                resultado.variable = gradoResultado === 1 ? 'x' : `x^${gradoResultado}`;
            } else if (gradoResultado < 0) {
                throw new Error('El grado del dividendo debe ser mayor o igual al del divisor');
            }
    
            const resultadoFinal = this.fraccionAString(resultado.coeficiente) + (resultado.variable ? resultado.variable : '');
    
            const explicacion = `Se realizó la división de términos similares:\n\n
            🔹 Dividendo: **${this.fraccionAString(dividendo[0].coeficiente)}${dividendo[0].variable}**\n
            🔹 Divisor: **${this.fraccionAString(divisor[0].coeficiente)}${divisor[0].variable}**\n
            🔹 Coeficiente resultante: **${this.fraccionAString(dividendo[0].coeficiente)} ÷ ${this.fraccionAString(divisor[0].coeficiente)}**\n
            🔹 Exponente resultante: **${gradoDividendo} - ${gradoDivisor}**\n
            🔹 Resultado final: **${resultadoFinal}**\n`;
    
            return {
                resultado: resultadoFinal,
                explicacion
            };
        } catch (error) {
            return { error: `Error en la división: ${error.message}` };
        }
    }
    
}