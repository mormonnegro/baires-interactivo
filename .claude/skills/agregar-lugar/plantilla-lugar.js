// <El nombre del lugar> (<año>, de <quién>), en <dónde: las calles de hoy>.
// De dónde sale cada cosa (una línea por fuente, con el título exacto de la foto o del artículo):
//   · «<Título del archivo en Wikimedia Commons>» (<autor>, <año>, dominio público): el frente sobre <calle> y …
//   · Wikipedia en español, «<artículo>» (consultada el <fecha>): los años y los autores.
//   · La planta: las esquinas de hoy (tools/esquina.mjs) y la foto aérea de 1940 del mapa de la Ciudad.
// Lo que es supuesto: <las alturas, a ojo sobre la foto; el costado que la foto no muestra; …>.
//
// (Copiá este archivo a src/lugares/<nombre-con-guiones>.js, registralo al final de LUGARES en src/hitos.js y
// borrá estas dos líneas. Las piezas están explicadas en src/lugares/LEEME.md.)

export const LUGAR = {
  nombre: '<El nombre del lugar>',
  clase: 'edificio',                 // o 'conjunto' (una plaza, un parque, un estadio, varias cosas)
  desde: 1900,                       // el año en que quedó hecho
  // hasta: 1931,                    // el año en que se demolió, si se demolió
  esquina: ['<Calle>', '<Otra calle>'],   // con los nombres de `node tools/esquina.mjs --calle …`
  coordenadas: [-34.6, -58.4],       // latitud y longitud de hoy, de otra fuente que la esquina (decí cuál en `fuentes`)
  marcas: ['<El nombre de la marca>'],
  fuentes: [
    '<página, con su dirección>: <qué se tomó de ahí>',
    '<otra>: <qué>',
  ],
  supuestos: ['<lo que no se pudo verificar>'],
  // solar: 'Despejar desde <año> el solar de esquinas [x, y], [x, y], [x, y], [x, y] (píxeles del plano): hoy el generador pone casas ahí.',
};

export default function (c) {
  const { PIEDRA, CASA, PIZARRA, TINTA, CREMA } = c;
  // El origen, en píxeles del plano (el centro del edificio), y hacia dónde apunta su x (un vector del plano: acá, de
  // la esquina A a la esquina B del frente). Sin rumbo, el x va a lo largo de la grilla de la ciudad, hacia el norte.
  const T = c.lugar(10000, 9000 /* , ux, uy */);
  c.epoca(c.etapaDe(LUGAR.desde) /* , c.etapaDe(LUGAR.hasta) */);

  // Primero el volumen, solo: corré la revisión y miralo contra la foto aérea antes de sumar nada.
  const L = 40, W = 25, H = 14; // el frente, el fondo y el alto, en metros
  T.caja(L, H, W, 0, 0, 0, CASA, { floors: 3, tono: CREMA });
  T.caja(L + 0.8, 0.6, W + 0.8, 0, H, 0, PIEDRA, { tono: CREMA }); // la cornisa
  // Después, lo que se ve desde arriba: el techo, la torre, el pórtico, las filas de vanos de cada frente…
  //   T.tejado(L, W, 4, 0, H + 0.6, 0, 'x', PIZARRA);
  //   T.fila(7, -L / 2 + 2, L / 2 - 2, 1.6, 3.2, 1, W / 2 + 0.05, '+z');
  //   T.cilindro(0.2, 4, 0, H, 0, TINTA, 6);
}
