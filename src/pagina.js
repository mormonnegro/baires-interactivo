// La página: la ciudad se dibuja con su profundidad, y después, en una sola pasada sobre toda la pantalla:
//   1. el contorno: una línea de tinta donde la profundidad pega un salto (el borde de una casa contra la calle) o se
//      quiebra (la arista entre una pared y su azotea);
//   2. el papel: grano, y los bordes de la hoja un poco más oscuros.
import * as THREE from 'three';

export function createPagina(renderer) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { samples: 4, depthBuffer: true });
  target.depthTexture = new THREE.DepthTexture(size.x, size.y, THREE.UnsignedIntType);
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false,
    uniforms: { tColor: { value: target.texture }, tDepth: { value: target.depthTexture }, uSize: { value: size.clone() }, uNear: { value: 1 }, uFar: { value: 1000 }, uPix: { value: 0.001 }, uInk: { value: new THREE.Color(0x2e2620) }, uLine: { value: 1 }, uColor: { value: 0 } },
    vertexShader: /* glsl */ `out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      in vec2 vUv; layout(location = 0) out vec4 outC;
      uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 uSize; uniform float uNear; uniform float uFar; uniform float uPix; uniform vec3 uInk; uniform float uLine; uniform float uColor;
      // (en la profundidad cruda, un plano es una rampa recta en pantalla: la segunda diferencia da cero salvo en bordes y aristas)
      float d(vec2 uv) { return texture(tDepth, uv).r; }
      float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec2 t = uLine / uSize;
        float c = d(vUv), l = d(vUv - vec2(t.x, 0.0)), r = d(vUv + vec2(t.x, 0.0)), u = d(vUv + vec2(0.0, t.y)), b = d(vUv - vec2(0.0, t.y));
        float k = (uFar - uNear) / (uNear * uFar), z = 1.0 / max(1.0 / uNear - c * k, 1e-6);
        // el salto, en metros, contra lo que mide un píxel a esa distancia
        float lap = max(abs(l + r - 2.0 * c), abs(u + b - 2.0 * c)) * k * z * z, pix = z * uPix * uLine;
        float edge = smoothstep(0.35, 1.1, lap / pix);
        // (lejos, donde una casa son dos píxeles, las líneas se aflojan: si no, el fondo sería una mancha negra)
        edge *= clamp(1.25 - pix * 0.55, 0.0, 1.0) * step(c, 0.99999);
        vec3 col = texture(tColor, vUv).rgb;
        // (en color el contorno casi se va, y a lo lejos todo se aclara con la bruma)
        col = mix(col, mix(uInk, col * 0.45, uColor), edge * mix(0.82, 0.5, uColor));
        col = mix(col, vec3(0.8, 0.78, 0.72), uColor * step(c, 0.99999) * 0.5 * (1.0 - exp(-z / 9000.0)));
        // el grano del papel
        vec2 p = gl_FragCoord.xy;
        float g = vnoise(p * 0.9) * 0.5 + vnoise(p * 0.23) * 0.3 + vnoise(p * vec2(0.03, 0.4)) * 0.2;
        col *= mix(0.955, 0.98, uColor) + mix(0.075, 0.03, uColor) * g;
        vec2 q = vUv - 0.5; q.x *= uSize.x / uSize.y * 0.8;
        col *= 1.0 - 0.2 * smoothstep(0.4, 1.05, length(q));
        outC = vec4(col, 1.0);
      }`,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material); quad.frustumCulled = false;
  const stage = new THREE.Scene(); stage.add(quad);
  const flat = new THREE.Camera();
  return {
    U: material.uniforms,
    resize() { renderer.getDrawingBufferSize(size); target.setSize(size.x, size.y); material.uniforms.uSize.value.copy(size); },
    render(scene, camera) {
      const U = material.uniforms;
      U.uNear.value = camera.near; U.uFar.value = camera.far; U.uPix.value = (2 * Math.tan((camera.fov * Math.PI) / 360)) / size.y; U.uLine.value = Math.max(1, size.y / 1000);
      renderer.setRenderTarget(target); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(stage, flat);
    },
  };
}
