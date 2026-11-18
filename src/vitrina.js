// La vitrina: el visor sin nada alrededor (?limpio&color&vitrina), metido en otra página —edificios.html— que lo lleva
// de un edificio a otro. La página manda mensajes; acá se elige el año, se vuela hasta el lugar, se le da vueltas
// despacio y se aclara solo ese edificio (el mismo velo de las fichas, src/ficha.js), para que se lo distinga entre
// los demás.
//   la página → el visor:  { vitrina: 'ir', px, py, alto, año, radio, nivel, velo }   (px, py: píxeles del plano)
//                          { vitrina: 'ciudad', año }      la vista entera
//                          { vitrina: 'quieta', si }       deja de girar (o vuelve a girar)
//   el visor → la página:  { vitrina: 'lista', años, iglesias: [{ nombre, px, py, alto }] }
//                          { vitrina: 'tocada' }           quien mira movió la cámara con la mano
//                          { vitrina: 'soltar' }           apretó Escape con la cámara agarrada

export function createVitrina({ cam, epocas, U, hitos, levantar, pedirCuadro, plano, vista, lienzo }) {
  const { plaza, metro } = plano, GIRO = 0.085; // (radianes por segundo: una vuelta cada 74 segundos)
  const mundo = (px, py) => [(px - plaza[0]) * metro, (py - plaza[1]) * metro];
  let sitio = null, gira = true, velo = 0, hacia = 0, pulso = 0;

  /** A qué distancia y con qué inclinación se mira algo de `alto` metros (y de `radio` a la redonda). */
  const encuadre = (alto, radio) => {
    const angosta = innerWidth < innerHeight * 0.9; // (en la ventana alta de un teléfono entra menos a lo ancho)
    const dist = Math.min(900, Math.max(210, alto * 4.4 + 110, radio * 4.2) * (angosta ? 1.2 : 1));
    return { dist, pitch: alto > 75 ? 0.4 : alto > 40 ? 0.46 : 0.52 };
  };

  function ir({ px, py, alto = 20, año = 0, radio = 0, nivel = 2, velo: que = null }) {
    const [x, z] = mundo(px, py), r = radio || (nivel === 1 ? 75 : 48);
    levantar(true);
    if (año && epocas.año !== año) epocas.elegir(año);
    const lejos = Math.hypot(x - cam.goal.x, z - cam.goal.z);
    cam.flyTo({ x, z, ...encuadre(alto, r), yaw: cam.goal.yaw + 0.55 }, lejos > 2500 ? 3.4 : lejos > 30 ? 2.6 : 1.2);
    sitio = { x, z, r, que, año }; gira = true; hacia = 1; pulso = 1; pedirCuadro(3);
  }
  function ciudad({ año = 0 } = {}) {
    levantar(true);
    if (año && epocas.año !== año) epocas.elegir(año);
    cam.flyTo({ ...vista, yaw: cam.goal.yaw + 0.5 }, 3.2);
    sitio = null; gira = true; hacia = 0; pedirCuadro(3);
  }

  /** El velo: solo el edificio (por su ancla, si hitos.js le encuentra una) o lo que haya a la redonda. */
  function aclarar(k) {
    if (!sitio || k <= 0.002) { U.uSobre.value.w = 0; return; }
    const { x, z, r, que } = sitio, Q = U.uSobreQue.value, etapa = Math.max(0, epocas.lista.indexOf(sitio.año || epocas.año));
    const j = que || !hitos()?.junto ? null : hitos().junto(x, z, r, etapa);
    if (j?.ancla) { U.uSobre.value.set(x, z, j.ancla, k); Q.set(1, 0, 0, 0); return; }
    U.uSobre.value.set(x, z, r, k);
    if (que === 'suelo') Q.set(r < 30 ? 0 : 2, 1, r < 30 ? 0 : 1, 0); else Q.set(0, 0, 0, j && !j.hay ? 1 : 0);
  }

  let antes = performance.now();
  const tic = (ahora) => {
    requestAnimationFrame(tic);
    const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora;
    if (document.hidden || parado) return;
    // (al llegar, el edificio se enciende un momento y queda apenas más claro que los de al lado)
    pulso = Math.max(0, pulso - dt / 2.4);
    const meta = cam.flying ? 0 : hacia * (0.3 + 0.7 * pulso);
    if (cam.flying) pulso = 1;
    velo += (meta - velo) * (1 - Math.exp(-dt * 4)); aclarar(velo);
    if (gira && !cam.flying) cam.goal.yaw += GIRO * dt;
    if (gira || Math.abs(meta - velo) > 0.004) pedirCuadro(2);
  };
  let parado = false;
  requestAnimationFrame(tic);

  // quien mira puede agarrar la cámara: ahí deja de girar sola, hasta el próximo edificio
  lienzo.addEventListener('pointerdown', () => { if (gira) { gira = false; parent.postMessage({ vitrina: 'tocada' }, location.origin); } });
  lienzo.addEventListener('wheel', () => { if (gira) { gira = false; parent.postMessage({ vitrina: 'tocada' }, location.origin); } }, { passive: true });

  // (con la cámara agarrada el teclado queda de este lado del marco: Escape la devuelve a la página)
  addEventListener('keydown', (e) => { if (e.key === 'Escape') parent.postMessage({ vitrina: 'soltar' }, location.origin); });

  addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    const d = e.data;
    if (d.vitrina === 'ir') ir(d);
    else if (d.vitrina === 'ciudad') ciudad(d);
    else if (d.vitrina === 'quieta') { gira = !d.si; pedirCuadro(2); }
    else if (d.vitrina === 'parar') { parado = !!d.si; if (!parado) pedirCuadro(3); }
  });
  const iglesias = (hitos()?.iglesias ?? []).filter((g) => g.nombre !== 'iglesia' && g.nombre !== 'catedral').map((g) => ({ nombre: g.nombre, px: g.x, py: g.y, alto: g.alto }));
  const avisar = () => parent.postMessage({ vitrina: 'lista', años: epocas.lista, iglesias }, location.origin);
  // (la lista de años llega con datos/crece.json: se avisa cuando ya se puede elegir uno)
  (async () => { for (let i = 0; i < 80 && epocas.lista.length < 2; i++) await new Promise((r) => setTimeout(r, 150)); avisar(); })();
  return { ir, ciudad };
}
