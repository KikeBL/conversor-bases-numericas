# Conversor de bases numéricas

Abre **conversor_num_rico.html** con doble clic en un navegador moderno. Para compartirlo con los alumnos, envía únicamente ese archivo: contiene todo el HTML, CSS y JavaScript. No necesita Internet, servidor, instalación, fuentes externas ni frameworks.

## Revisión del original

El núcleo matemático estaba bien para enteros no negativos con dígitos válidos. Se comprobaron 44 entradas en las bases 2, 8, 10 y 16, incluidos cero, cambios de byte y el valor 9007199254740993, superior al límite de precisión de `Number`.

También eran correctos el uso de `BigInt`, las divisiones implícitas de `toString(base)`, la máscara de los 16 bits inferiores y el cambio de bits con XOR. La paridad contaba correctamente los bits a 1. El almacenamiento mínimo consideraba enteros sin signo, con un mínimo de un byte para cero.

Se encontraron y corrigieron estos problemas:

- La limpieza de entradas cambiaba el número silenciosamente: `-12` se convertía en `12`, `1.5` en `15` y `102` en binario en `10` (decimal 2). Ahora el texto se conserva y se explica el error. Los resultados se ocultan hasta tener una entrada válida.
- «Carácter ASCII» incluía valores de 128 a 255. ASCII termina en 127. Ahora se indica que esos bytes están fuera de ASCII y se aclara que se inspecciona el byte inferior del número.
- La interfaz afirmaba que se había copiado el número aunque `execCommand('copy')` devolviera `false`. Ahora se comprueba el resultado y se ofrece la selección manual cuando falla.
- Tailwind y las fuentes se descargaban de Internet. Se han sustituido por CSS propio y fuentes del sistema.
- Los bits eran elementos `div` que no podían activarse directamente con el teclado. Ahora son botones con nombre accesible, peso y estado pulsado.

La copia intacta está en **original/conversor_num_rico.html**. Esa copia conserva las dependencias y el comportamiento antiguos.

## Uso en clase

1. Escribe en cualquiera de los cuatro campos habituales o elige un valor de ejemplo. Los valores rápidos están expresados en decimal.
2. Elige **Base A** y **Base B**: binario (2), octal (8), decimal (10) o hexadecimal (16). También puedes editar directamente el número de cualquiera de esas dos bases.
3. Lee las dos explicaciones simultáneas: A → B y B → A representan la misma cantidad. Intercambiar bases cambia su orden y conserva el número.
4. Para llegar a decimal, multiplica cada cifra por el peso de su posición y suma. Las posiciones empiezan en cero por la derecha.
5. Para salir de decimal, divide sucesivamente entre la base de destino hasta obtener cociente cero. Los restos se leen de abajo arriba.
6. Si ninguna base es decimal, se muestran los dos pasos usando decimal como puente. Las operaciones de las tablas se escriben en decimal para evitar ambigüedades.
7. Entre dos bases de la lista 2, 8 y 16, aparece además el método de agrupación de bits en los dos sentidos. Los grupos se forman desde la derecha; solo se añaden o eliminan ceros iniciales.
8. La tabla de consulta inferior contiene las dos tablas cerradas de clase: los 8 dígitos octales con sus 3 bits y los 16 dígitos hexadecimales con sus 4 bits. Para convertir, separa el binario en grupos desde la derecha y busca cada grupo en la tabla. Los ceros del grupo se conservan.
9. Cambia un bit para experimentar. Si hay más de 16 bits, los superiores permanecen intactos.
10. Usa **Imprimir explicación**, o la impresión del navegador, para imprimir o guardar un PDF. Las tablas largas se despliegan al imprimir.

Ejemplos útiles: 42 decimal = 101010 binario = 52 octal = 2A hexadecimal; 255 decimal = FF hexadecimal; 16 hexadecimal = 22 decimal.

## Alcance

- Enteros no negativos de hasta **256 bits**, con aritmética exacta mediante `BigInt`.
- Solo bases 2, 8, 10 y 16; letras A a F para los valores 10 a 15 en hexadecimal. Se admiten minúsculas y ceros iniciales.
- Prefijos opcionales `0b`, `0o` y `0x` en binario, octal y hexadecimal respectivamente.
- No se admiten signos, fracciones ni separadores de miles. Los espacios al principio y al final sí se ignoran.
- Se muestran inicialmente 12 filas por tabla de operaciones. El resto puede desplegarse sin perder ningún paso.
- La copia automática depende del permiso del navegador; siempre queda disponible la copia manual del texto.

## Comprobaciones

El archivo opcional **comprobar.cjs** usa exclusivamente módulos de Node y no se necesita para utilizar la web. Desde esta carpeta se ejecuta con:

```sh
node comprobar.cjs
```

Resultado de la comprobación: **244 conversiones y 57.445 aserciones correctas**. Se verifican entradas válidas e inválidas, las cuatro bases disponibles, sumas posicionales, identidades de división, reconstrucción mediante restos, agrupación binaria, cero, límite de 256 bits y valores mayores que `Number.MAX_SAFE_INTEGER`. También se comprueba que los dos selectores ofrecen únicamente las bases 2, 8, 10 y 16 y que se rechazan otras bases.

También se comprueban los estados y eventos con un DOM simulado: entradas, errores, botones, cambios e intercambio de bases, preservación de bits superiores, expansión de tablas para impresión y rutas de éxito y fallo de copia. Se revisaron la estructura HTML, la asociación de etiquetas y los contrastes de texto y controles.

**Límite de la verificación:** el navegador integrado bloqueó la apertura de la URL local `file://`. No se ha validado visualmente el diseño en un navegador real ni se ha probado su portapapeles real. Las pruebas de DOM no sustituyen esa revisión visual.
