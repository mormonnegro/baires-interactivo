// La Fuente de las Nereidas (Lola Mora, 1903) en su primer lugar: el cantero en punta entre el Paseo de Julio (hoy
// avenida Leandro N. Alem), la avenida Rosales y Cangallo (hoy Presidente Perón). Estuvo ahí de 1903 a 1918; la que
// se ve desde 1921 en la Costanera Sur es la misma, mudada (src/lugares/puerto.js).
// De dónde sale cada cosa:
//   · los años: Wikipedia en español, «Fuente Monumental Las Nereidas» (consultada el 2026-11-18): se inauguró el 21
//     de mayo de 1903 y la mudaron en 1918. Lo mismo dice Patricia V. Corsani, «Honores y renuncias. La escultora
//     argentina Lola Mora y la fuente de los debates», Anais do Museu Paulista, vol. 15, n.º 2, 2007, pp. 169-196
//     (https://www.redalyc.org/pdf/273/27315217.pdf), que precisa: en la Costanera Sur, desde el 8 de diciembre de 1918.
//   · el lugar: Wikipedia la pone en «la intersección del Paseo de Julio con la calle Cangallo»; Corsani, en el Paseo
//     de Julio «entre Bartolomé Mitre y ex Cangallo», con un plano (su figura 1) que la marca con una flecha en la
//     punta que queda entre Alem, Rosales y Perón, a unos dos tercios del camino de Mitre a Perón, y una foto de hacia
//     1910 tomada desde la Casa de Gobierno (su figura 5) donde la Venus asoma «entre el follaje de los árboles del
//     cantero de forma triangular». No coincide una nota de La Nación del 26 de mayo de 2023 («Una escultura
//     "pornográfica"…»), que la pone «entre Presidente Perón y Sarmiento», una cuadra más al norte: acá va donde dicen
//     las otras dos.
//   · el vecino que sigue en pie: en «Archivo General de la Nación Argentina 1910 aprox Buenos Aires, uente Las
//     Nereidas - Lola Mora - en su ubicación primitiva.jpg» y en la postal «Alem y Cangallo.JPG» (las dos en Wikimedia
//     Commons, de dominio público) se ve detrás de la fuente el Palace Hotel, que es hoy la sede de 25 de Mayo 221 de
//     la Facultad de Filosofía y Letras, en la esquina de Perón (Wikipedia en español, «Laboratorio de Idiomas
//     (Universidad de Buenos Aires)»: −34,60542, −58,37089). Cae a unos 130 metros de donde va la fuente, cruzando
//     el Paseo de Julio.
//   · la forma: esas dos fotos y «Fuente las nereidas en paseo de julio 1916.jpg» (Commons, 1916, dominio público).
//     Se ve la plataforma redonda de piedra; encima, la valva grande de mármol, con el agua; en el medio, la roca,
//     oscura; alrededor, los caballos que salen del agua, cada uno con su tritón; arriba, las dos nereidas que
//     sostienen la valva chica y la Venus. Alrededor, césped, una cadena sobre postes bajos y árboles.
//   · el cantero: el contorno es el que src/lugares/plaza-colon.js le da a esa punta desde 1921, medido sobre la foto
//     aérea de 1940.
// Lo que es supuesto: el punto exacto dentro del cantero; las medidas (a ojo sobre las fotos, con los caballos de
// escala: unos 10 metros de ancho y 7 de alto; Wikipedia da para la fuente de hoy «6 m de alto (aprox.) x 13 m de
// ancho (aprox)»); hacia dónde miraba cada figura (Corsani dice que la Venus miraba a la Casa de Gobierno); que el
// cantero tuviera en 1905 y 1910 el contorno de 1940; cuántos postes tenía la cadena.
// Lo que falta: los árboles del cantero, que en las fotos lo llenan. Con árboles propios (`T.arbol`) la revisión de
// este lugar mide mal: src/hitos.js manda al final de la lista los árboles de 1950 de todos los lugares, y los
// últimos pasan a contarse como de este. Quedan para cuando eso se arregle.

export const LUGAR = {
  nombre: 'Fuente de las Nereidas (1903)',
  clase: 'edificio',
  desde: 1903,
  hasta: 1918,
  esquina: ['Avenida Leandro N. Alem', 'Teniente General Juan Domingo Perón'],
  marcas: ['Fuente de las Nereidas'],
  fuentes: [
    'Wikipedia en español, «Fuente Monumental Las Nereidas», https://es.wikipedia.org/wiki/Fuente_Monumental_Las_Nereidas (consultada el 2026-11-18): la autora, quién la encargó, la inauguración del 21 de mayo de 1903 en el Paseo de Julio y Cangallo, y la mudanza de 1918',
    'Patricia V. Corsani, «Honores y renuncias. La escultora argentina Lola Mora y la fuente de los debates», Anais do Museu Paulista, vol. 15, n.º 2, 2007, https://www.redalyc.org/pdf/273/27315217.pdf: las mismas fechas (en la Costanera Sur desde el 8 de diciembre de 1918), el lugar «entre Bartolomé Mitre y ex Cangallo», el plano que la marca en la punta entre Alem, Rosales y Perón, y la foto de hacia 1910 con la Venus entre los árboles del cantero triangular',
    'La Nación, «Una escultura "pornográfica" escandalizó a la sociedad argentina…», 26 de mayo de 2023: la pone «entre Presidente Perón y Sarmiento»; no coincide con las dos anteriores y no se siguió',
    'Wikimedia Commons, «Archivo General de la Nación Argentina 1910 aprox Buenos Aires, uente Las Nereidas - Lola Mora - en su ubicación primitiva.jpg» (hacia 1910, dominio público): la fuente entera, el césped, la cadena y, detrás, el Palace Hotel',
    'Wikimedia Commons, «Alem y Cangallo.JPG» (postal de hacia 1910, dominio público): la fuente con el Palace Hotel detrás',
    'Wikimedia Commons, «Fuente las nereidas en paseo de julio 1916.jpg» (1916, dominio público): la plataforma, la valva, la roca y las figuras, de cerca',
    'Wikipedia en español, «Laboratorio de Idiomas (Universidad de Buenos Aires)» (consultada el 2026-11-18): el Palace Hotel de las fotos es el edificio de 25 de Mayo 221, esquina Perón, que sigue en pie (−34,60542, −58,37089). Es la segunda referencia del lugar: nadie da las coordenadas de donde estuvo la fuente',
    'src/lugares/plaza-colon.js: el contorno del cantero en punta, medido sobre la foto aérea de 1940',
  ],
  supuestos: [
    'el punto exacto dentro del cantero',
    'las medidas de la fuente, a ojo sobre las fotos',
    'hacia dónde miraba cada figura',
    'que el cantero tuviera en 1905 y 1910 el contorno de 1940',
    'cuántos postes tenía la cadena',
  ],
};

export default function (c) {
  const { THREE, PIEDRA, PINTADO, PINTA, TINTA } = c, M = 0.675;
  const OX = 10747, OY = 9969; // el medio de la fuente, en píxeles del plano
  const T = c.lugar(OX, OY, 1, 0); // (x: hacia el norte, como el plano; z: hacia el río)
  /** de píxeles del plano a metros del lugar */
  const q = (px, py) => [(px - OX) * M, (py - OY) * M];
  const MAR = { tono: c.BLANCO }, ROCA = { tono: c.GRIS };
  c.epoca(c.etapaDe(LUGAR.desde), c.etapaDe(LUGAR.hasta));

  // El cantero en punta, entre el Paseo de Julio (al oeste), Rosales (en diagonal, al este) y Cangallo (al norte):
  // césped, con la fuente cerca de la base. El contorno, el de src/lugares/plaza-colon.js.
  const yRosales = (x) => 9930 + (x - 10476) * 0.3065;
  T.cantero([q(10606, 9947), q(10772, 9947), q(10772, yRosales(10772) - 22)]);
  // (Los árboles del cantero, que se ven en las fotos, no van: ver el comentario de arriba.)

  // La fuente. Abajo, la plataforma redonda de piedra; alrededor, la cadena (acá, solo los postes).
  const RP = 5.6;
  T.cilindro(RP, 0.5, 0, 0.28, 0, PIEDRA, 18, RP, { tono: c.SILLAR });
  for (let i = 0; i < 12; i++) { const a = ((i + 0.5) / 12) * Math.PI * 2; T.cilindro(0.2, 0.9, Math.cos(a) * 8.2, 0.28, Math.sin(a) * 8.2, TINTA, 5, 0.14); }
  // la valva grande, de mármol, que se abre hacia arriba, y el agua adentro
  T.cilindro(3.7, 1, 0, 0.78, 0, PIEDRA, 14, 5, MAR);
  T.cilindro(4.5, 0.14, 0, 1.78, 0, PINTADO, 14, 4.5, { pinta: [PINTA.AGUA, 0.7] });
  // la roca del medio, oscura
  T.cilindro(2, 1.5, 0, 1.78, 0, PIEDRA, 7, 1.6, ROCA); T.cilindro(1.6, 1.3, 0, 3.28, 0, PIEDRA, 6, 1.05, ROCA);
  // los caballos que salen del agua, cada uno con su tritón al lado
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI, sx = Math.sin(a), cz = Math.cos(a);
    T.put(new THREE.BoxGeometry(0.7, 1.2, 2.1).rotateX(-0.5).rotateY(a).translate(sx * 2.9, 2.75, cz * 2.9), PIEDRA, MAR);
    T.cilindro(0.3, 1.5, sx * 2.5 + cz * 1.1, 1.9, cz * 2.5 - sx * 1.1, PIEDRA, 5, 0.2, MAR);
  }
  // arriba: las dos nereidas, la valva chica que sostienen y la Venus
  for (const s of [-1, 1]) T.cilindro(0.34, 1.7, 0, 4.58, s * 0.42, PIEDRA, 5, 0.22, MAR);
  T.cilindro(0.45, 0.45, 0, 6.05, 0, PIEDRA, 8, 1.1, MAR);
  T.cilindro(0.3, 1.1, 0, 6.5, 0, PIEDRA, 5, 0.2, MAR);
}
