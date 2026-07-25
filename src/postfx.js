import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// low-freq noise for optional ink wobble only (no paper grain path)
function noiseTexture(size = 128) {
  const data = new Uint8Array(size * size * 4);
  const hash = (x, y) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const vnoise = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    const ux = xf * xf * (3 - 2 * xf);
    const uy = yf * yf * (3 - 2 * yf);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const lf = vnoise(x * 0.04, y * 0.04);
      const lf2 = vnoise(x * 0.04 + 40, y * 0.04 + 40);
      const i = (y * size + x) * 4;
      data[i] = lf * 255;
      data[i + 1] = lf2 * 255;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// clean silhouette outline — depth first, normals secondary, almost no wobble
const OutlineShader = {
  uniforms: {
    tDiffuse: { value: null },
    tNormal: { value: null },
    tDepth: { value: null },
    uNoise: { value: null },
    uResolution: { value: new THREE.Vector2() },
    uNear: { value: 0.1 },
    uFar: { value: 100 },
    uThickness: { value: 0.9 },
    uDepthBias: { value: 0.0022 },
    uNormalBias: { value: 0.62 },
    uSketch: { value: 0.0 },
    uOutlineColor: { value: new THREE.Color(0x3a3548) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    #include <packing>
    varying vec2 vUv;
    uniform sampler2D tDiffuse, tNormal, tDepth, uNoise;
    uniform vec2 uResolution;
    uniform float uNear, uFar, uThickness, uDepthBias, uNormalBias, uSketch;
    uniform vec3 uOutlineColor;

    float linearDepth(vec2 uv){
      float d = texture2D(tDepth, uv).x;
      float viewZ = perspectiveDepthToViewZ(d, uNear, uFar);
      return viewZToOrthographicDepth(viewZ, uNear, uFar);
    }
    void main(){
      vec4 base = texture2D(tDiffuse, vUv);
      vec2 px = uThickness / uResolution;

      // tiny stable wobble only when sketch > 0
      vec2 wob = (texture2D(uNoise, gl_FragCoord.xy * 0.008).rg - 0.5) * uSketch * px * 4.0;
      vec2 c0 = clamp(vUv + wob, vec2(0.001), vec2(0.999));

      float dC = linearDepth(c0);
      if (dC > 0.998) { gl_FragColor = base; return; }

      float dN = linearDepth(c0 + vec2(0.0, px.y));
      float dS = linearDepth(c0 + vec2(0.0, -px.y));
      float dE = linearDepth(c0 + vec2(px.x, 0.0));
      float dW = linearDepth(c0 + vec2(-px.x, 0.0));
      float depthEdge = abs(dN + dS + dE + dW - 4.0 * dC);

      vec3 nC = texture2D(tNormal, c0).rgb;
      float normalEdge =
          distance(texture2D(tNormal, c0 + vec2(0.0, px.y)).rgb, nC)
        + distance(texture2D(tNormal, c0 + vec2(0.0, -px.y)).rgb, nC)
        + distance(texture2D(tNormal, c0 + vec2(px.x, 0.0)).rgb, nC)
        + distance(texture2D(tNormal, c0 + vec2(-px.x, 0.0)).rgb, nC);

      // hard-ish edges, no noisy weight modulation
      float de = step(uDepthBias, depthEdge);
      float ne = step(uNormalBias, normalEdge);
      float edge = clamp(max(de, ne * 0.75), 0.0, 1.0);
      // thinner lines in the distance
      edge *= 1.0 - smoothstep(0.45, 0.92, dC) * 0.4;

      // soft ink — blend toward mid-dark, not pure black
      vec3 ink = mix(uOutlineColor, base.rgb * 0.55, 0.35);
      gl_FragColor = vec4(mix(base.rgb, ink, edge * 0.85), base.a);
    }`,
};

// Soft cel grade: bright midtones, light posterize, almost no vignette
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uLevels: { value: 14.0 },
    uDither: { value: 0.03 },
    uSaturation: { value: 1.05 },
    uGrain: { value: 0.0 },
    uLift: { value: 0.05 },
    uContrast: { value: 0.98 },
    uWarm: { value: 0.02 },
    uVignette: { value: 0.04 },
  },
  vertexShader: OutlineShader.vertexShader,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uLevels, uDither, uSaturation, uGrain, uLift, uContrast, uWarm, uVignette;

    // stable ordered dither (no crawling grain)
    float bayer4(vec2 p){
      int x = int(mod(p.x, 4.0));
      int y = int(mod(p.y, 4.0));
      int idx = x + y * 4;
      // 4x4 Bayer matrix
      float m[16];
      m[0]=0.0;m[1]=8.0;m[2]=2.0;m[3]=10.0;
      m[4]=12.0;m[5]=4.0;m[6]=14.0;m[7]=6.0;
      m[8]=3.0;m[9]=11.0;m[10]=1.0;m[11]=9.0;
      m[12]=15.0;m[13]=7.0;m[14]=13.0;m[15]=5.0;
      return (m[idx] + 0.5) / 16.0;
    }

    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      c = max(c, 0.0);

      // mild lift only — washed-out was mostly over-lift
      c = c * (1.0 - uLift) + uLift;
      c = (c - 0.5) * uContrast + 0.5;

      // optional tiny ordered dither — static, not noisy
      float d = (bayer4(gl_FragCoord.xy) - 0.5) * uDither / max(uLevels, 1.0);
      c += d;

      // very soft posterize — keep most of the original brightness
      float lv = max(uLevels, 2.0);
      vec3 hard = floor(c * lv + 0.5) / lv;
      vec3 soft = floor(c * lv) / lv + 0.5 / lv;
      vec3 q = mix(c, mix(soft, hard, 0.4), 0.28);

      float l = dot(q, vec3(0.2126, 0.7152, 0.0722));
      q = mix(vec3(l), q, uSaturation);

      float mid = smoothstep(0.12, 0.55, l) * (1.0 - smoothstep(0.65, 0.95, l));
      q.r += uWarm * 0.7 * mid;
      q.g += uWarm * 0.2 * mid;
      q.b -= uWarm * 0.25 * mid;

      // almost-off vignette (uVignette ~0.04 → no dark corners)
      vec2 vc = vUv - 0.5;
      float vig = 1.0 - dot(vc, vc) * (uVignette * 1.6);
      q *= clamp(vig, 0.88, 1.0);

      q = clamp(q, 0.0, 1.0);
      gl_FragColor = vec4(q, 1.0);
    }`,
};

export function createPostFX(renderer, scene, camera) {
  const dbs = renderer.getDrawingBufferSize(new THREE.Vector2());
  const noise = noiseTexture(128);

  const depthTexture = new THREE.DepthTexture(dbs.x, dbs.y);
  depthTexture.type = THREE.UnsignedIntType;
  const normalRT = new THREE.WebGLRenderTarget(dbs.x, dbs.y, {
    depthTexture,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });
  const normalMaterial = new THREE.MeshNormalMaterial();

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));

  const outlinePass = new ShaderPass(OutlineShader);
  outlinePass.uniforms.tNormal.value = normalRT.texture;
  outlinePass.uniforms.tDepth.value = depthTexture;
  outlinePass.uniforms.uNoise.value = noise;
  outlinePass.uniforms.uResolution.value.copy(dbs);
  outlinePass.uniforms.uNear.value = camera.near;
  outlinePass.uniforms.uFar.value = camera.far;
  composer.addPass(outlinePass);

  const gradePass = new ShaderPass(GradeShader);
  composer.addPass(gradePass);

  composer.addPass(new SMAAPass());
  composer.addPass(new OutputPass());

  const hidden = [];
  const prevClear = new THREE.Color();
  function render() {
    const prevAlpha = renderer.getClearAlpha();
    renderer.getClearColor(prevClear);
    hidden.length = 0;
    scene.traverse((o) => {
      if (o.visible && o.userData.noOutline) {
        hidden.push(o);
        o.visible = false;
      }
    });
    scene.overrideMaterial = normalMaterial;
    renderer.setRenderTarget(normalRT);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    scene.overrideMaterial = null;
    for (const o of hidden) o.visible = true;
    renderer.setClearColor(prevClear, prevAlpha);

    composer.render();
  }

  function setSize(w, h) {
    composer.setSize(w, h);
    renderer.getDrawingBufferSize(dbs);
    normalRT.setSize(dbs.x, dbs.y);
    outlinePass.uniforms.uResolution.value.copy(dbs);
  }

  return {
    render,
    setSize,
    outline: outlinePass.uniforms,
    // keep old name so main.js GUI still works
    posterize: gradePass.uniforms,
  };
}
