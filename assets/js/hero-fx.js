/* =========================================================
   ANEMA ROOF — hero WebGL layer
   3D membrána v perspektivě + jiskrový scan.
   Raw WebGL (bez závislostí), kreslí se přes screen blend.
   ========================================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('fx');
  if (!canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) { canvas.style.display = 'none'; return; }

  var gl = canvas.getContext('webgl', {
    alpha: true, premultipliedAlpha: false, antialias: false, depth: false, powerPreference: 'low-power'
  });
  if (!gl) { canvas.style.display = 'none'; return; }

  /* ---------------- shaders ---------------- */

  var VERT = [
    'attribute vec2 aPos;',
    'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform vec2  uPointer;',

    'float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }',

    // vzdálenost k nejbližší mřížkové čáře (spáry fólie)
    'float seam(float v, float w){',
    '  float d = abs(fract(v) - 0.5);',
    '  return smoothstep(0.5, 0.5 - w, d);',
    '}',

    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;',

    // paprsek kamery, mírně natočený pohledem myši
    '  vec3 ro = vec3(0.0, 1.0, 0.0);',
    '  vec3 rd = normalize(vec3(uv.x + uPointer.x * 0.06, uv.y - 0.22 + uPointer.y * 0.04, 1.0));',

    '  vec3 col = vec3(0.0);',

    // průsečík s rovinou střechy y = 0
    '  if (rd.y < -0.0025) {',
    '    float t = ro.y / -rd.y;',
    '    vec3 p = ro + rd * t;',
    '    float drift = uTime * 0.55;',
    '    vec2 g = vec2(p.x * 0.5, (p.z + drift) * 0.5);',

    // šířka čáry podle vzdálenosti (anti-alias)
    '    float w = clamp(0.012 + t * 0.0016, 0.012, 0.09);',
    '    float lines = max(seam(g.x, w), seam(g.y, w));',

    // útlum do dálky
    '    float fade = exp(-t * 0.055);',
    '    col += vec3(0.42, 0.46, 0.52) * lines * fade * 0.30;',

    // jiskrový scan — pás putující po ploše
    '    float head = mod(uTime * 3.4, 26.0);',
    '    float band = exp(-abs((p.z + drift) - head) * 1.35);',
    '    col += vec3(0.85, 0.10, 0.13) * band * fade * 0.55;',
    '    col += vec3(1.00, 0.30, 0.22) * band * lines * fade * 1.15;',

    // ojedinělé jiskry na scan-pásu
    '    vec2 cell = floor(vec2(p.x * 0.8, (p.z + drift) * 0.8));',
    '    float n = hash(cell);',
    '    float blink = step(0.972, n * (0.6 + 0.4 * sin(uTime * 6.0 + n * 40.0)));',
    '    vec2 f = fract(vec2(p.x * 0.8, (p.z + drift) * 0.8)) - 0.5;',
    '    float dot_ = exp(-dot(f, f) * 90.0);',
    '    col += vec3(1.0, 0.55, 0.35) * blink * dot_ * band * fade * 2.2;',

    // opar nad plochou
    '    col += vec3(0.05, 0.06, 0.08) * fade * 0.5;',
    '  }',

    // záře nad horizontem
    '  float hz = exp(-abs(uv.y + 0.215) * 12.0);',
    '  col += vec3(0.30, 0.10, 0.11) * hz * 0.34;',

    // vinětace, aby okraje nepřesvětlovaly fotku
    '  float vig = smoothstep(1.15, 0.25, length(uv * vec2(0.85, 1.25)));',
    '  col *= vig;',

    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[anema-fx]', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.style.display = 'none'; return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = 'none'; return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'uRes');
  var uTime = gl.getUniformLocation(prog, 'uTime');
  var uPointer = gl.getUniformLocation(prog, 'uPointer');

  /* ---------------- size ---------------- */

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.round(canvas.clientWidth * dpr);
    var h = Math.round(canvas.clientHeight * dpr);
    if (w === 0 || h === 0) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });

  /* ---------------- pointer ---------------- */

  var px = 0, py = 0, tx = 0, ty = 0;
  if (window.matchMedia('(hover:hover)').matches) {
    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  /* ---------------- loop ---------------- */

  var visible = true;
  var rafId = 0;
  var start = performance.now();

  function frame(now) {
    rafId = 0;
    if (!visible || document.hidden) return;
    resize();
    px += (tx - px) * 0.05;
    py += (ty - py) * 0.05;
    gl.uniform2f(uPointer, px, py);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    rafId = requestAnimationFrame(frame);
  }

  function play() {
    if (!rafId && visible && !document.hidden) rafId = requestAnimationFrame(frame);
  }

  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    play();
  }, { threshold: 0 }).observe(canvas);

  document.addEventListener('visibilitychange', play);

  reduced.addEventListener('change', function (e) {
    if (e.matches) { visible = false; canvas.style.display = 'none'; }
  });

  resize();
  play();
})();
