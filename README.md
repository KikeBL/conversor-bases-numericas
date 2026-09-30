# Conversor de bases numéricas

Una herramienta para aprender a convertir entre **binario (2), octal (8), decimal (10) y hexadecimal (16)**. Muestra cada operación y permite experimentar con los bits del número.

## Empezar

Descarga [conversor_num_rico.html](conversor_num_rico.html) y ábrelo con doble clic en un navegador moderno. Puedes enviar ese único archivo a tus alumnos: contiene todo el HTML, CSS y JavaScript y funciona sin Internet, servidor, instalación ni frameworks.

También puedes descargar el repositorio completo desde **Code → Download ZIP**.

## Qué incluye

- Conversión simultánea en las cuatro bases.
- Selección de dos bases y explicaciones de A → B y B → A para el mismo número.
- Multiplicación por potencias, suma de aportaciones y divisiones sucesivas con lectura de restos.
- Tablas cerradas de conversión: los 8 valores octales con 3 bits y los 16 valores hexadecimales con 4 bits.
- Inspector interactivo de los 16 bits inferiores, paridad, tamaño mínimo y consulta ASCII.
- Validación de entradas, copia de resultados e impresión de las explicaciones.
- Diseño oscuro adaptable a móvil y controles accesibles por teclado.

Admite enteros no negativos de hasta 256 bits con aritmética exacta mediante `BigInt`. No admite fracciones ni números negativos.

## Archivos

| Archivo | Contenido |
| --- | --- |
| [conversor_num_rico.html](conversor_num_rico.html) | Aplicación completa, lista para usar y compartir. |
| [LEEME.md](LEEME.md) | Guía para clase, alcance y revisión del código original. |
| [comprobar.cjs](comprobar.cjs) | Pruebas matemáticas y de estados, sin dependencias externas. |
| [original/conversor_num_rico.html](original/conversor_num_rico.html) | Copia histórica de la primera versión. |

## Comprobaciones

Para ejecutar las pruebas, con Node.js instalado:

```sh
node comprobar.cjs
```

Se verifican 244 conversiones y 57.445 aserciones, incluidas las cuatro bases, los pasos de cálculo, los límites, la validación y los eventos mediante un DOM simulado. Esta simulación no sustituye la comprobación visual ni la del portapapeles en un navegador real.

Node.js solo se necesita para ejecutar las pruebas, no para utilizar la aplicación.
