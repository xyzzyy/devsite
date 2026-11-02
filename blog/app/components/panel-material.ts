/*
 * Material math adapted from anomalyco/rune, revision e936bd3028987cb407359d3ec9fdfe462065fba9:
 * crates/rune-light/src/shaders/{common,composite,gbuffer}.wgsl and examples/light.rs.
 * Copyright (c) 2026 Christopher Langton. MIT license: ../../third-party-notices/rune-light.txt.
 */

// One viewer-facing light for the viewport, shared by the floor, panels and controls.
export const PANEL_LIGHT = {
  brightness: 0.48,
  softness: 0.38,
  ambient: 0.28,
  // Linear RGB. Near-neutral with a trace of warmth, so dark greys stay grey, not brown.
  color: [1.0, 0.955, 0.91],
  x: 0.5,
  y: 0.5,
  height: 900,
} as const

export type MaterialPrimitive = {
  rect: [number, number, number, number]
  radius: number
  top: number
  rise: number
  bevel: [number, number]
  gloss: number
  roughness: number
  color: [number, number, number]
  border: number
  // Scales the minimum reflectance that keeps dark surfaces visible. The floor uses
  // less than the panels, so the panels separate from it instead of merging.
  lift?: number
  paper?: boolean
}

const vertexSource = `#version 300 es
in vec2 position;
uniform vec2 viewport;
uniform vec4 rect;
void main() {
  vec2 p = rect.xy - 20.0 + (position + 1.0) * 0.5 * (rect.zw + 40.0);
  gl_Position = vec4(p / viewport * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
}
`

const fragmentSource = `#version 300 es
precision highp float;
uniform vec2 viewport;
uniform vec4 rect;
uniform float density;
uniform vec4 geometry; // radius, top, bevel width, bevel height
uniform vec2 material; // gloss, roughness
uniform vec3 albedo; // OKLCH
uniform vec2 edge; // border opacity, height above supporting surface
uniform vec3 lamp; // shared viewer light, expressed in the scrolling canvas's coordinates
uniform vec3 lighting; // brightness, softness, ambient
uniform vec3 tint; // lamp colour, linear RGB
uniform float lift;
uniform float paper;
out vec4 pixel;
const float PI = 3.14159265;

float distanceToPanel(vec2 p) {
  vec2 halfSize = rect.zw * 0.5 - 0.5;
  float radius = min(geometry.x, min(halfSize.x, halfSize.y));
  vec2 q = abs(p - rect.zw * 0.5) - halfSize + radius;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
}

vec3 oklch(vec3 color) {
  float angle = radians(color.z);
  float a = color.y * cos(angle);
  float b = color.y * sin(angle);
  vec3 lms = vec3(
    color.x + 0.3963377774 * a + 0.2158037573 * b,
    color.x - 0.1055613458 * a - 0.0638541728 * b,
    color.x - 0.0894841775 * a - 1.2914855480 * b
  );
  lms = lms * lms * lms;
  return max(vec3(
    4.0767416621 * lms.x - 3.3077115913 * lms.y + 0.2309699292 * lms.z,
    -1.2684380046 * lms.x + 2.6097574011 * lms.y - 0.3413193965 * lms.z,
    -0.0041960863 * lms.x - 0.7034186147 * lms.y + 1.7076147010 * lms.z
  ), 0.0);
}

float ggx(float nh, float a) {
  float a2 = a * a;
  float d = nh * nh * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}

vec3 toSrgb(vec3 c) {
  vec3 low = c * 12.92;
  vec3 high = 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055;
  return mix(high, low, lessThanEqual(c, vec3(0.0031308)));
}

float noise(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

float paperHash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float paperNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(paperHash(cell), paperHash(cell + vec2(1.0, 0.0)), f.x),
    mix(paperHash(cell + vec2(0.0, 1.0)), paperHash(cell + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float paperTexture(vec2 p) {
  // Correlated pulp and fine irregular fibres, rather than isolated screen-pixel noise.
  // All coordinates belong to the sheet, including while it scrolls or rebounds.
  float pulp = paperNoise(p * 0.21 + vec2(23.0, 61.0));
  float formation = paperNoise(p * 0.035);
  vec2 fibreCoords = vec2(p.x * 0.43 + p.y * 0.18, p.y * 2.1 - p.x * 0.12);
  float fibres = paperNoise(fibreCoords + vec2(41.0, 17.0));
  float fine = paperNoise(p * 1.35 + vec2(11.0, 37.0));
  return 0.34 * pulp + 0.18 * formation + 0.32 * fibres + 0.16 * fine;
}

void main() {
  vec2 world = vec2(gl_FragCoord.x, viewport.y * density - gl_FragCoord.y) / density;
  vec2 p = world - rect.xy;
  float sd = distanceToPanel(p);
  float coverage = 1.0 - smoothstep(-0.5 / density, 0.5 / density, sd);
  if (coverage == 0.0) {
    if (edge.y == 0.0) discard;
    // Project the contact shadow away from the shared light.
    vec2 center = rect.xy + rect.zw * 0.5;
    vec2 offset = (center - lamp.xy) * edge.y / max(lamp.z - geometry.y, 1.0);
    float shadowDistance = distanceToPanel(p - offset);
    float contact = 1.0 - smoothstep(-0.5, 1.0 + edge.y * 0.18, shadowDistance);
    float penumbra = 1.0 - smoothstep(-1.0, 2.0 + edge.y * lighting.y, shadowDistance);
    float shadow = 1.0 - (1.0 - 0.75 * contact) * (1.0 - 0.55 * penumbra);
    pixel = vec4(0.0, 0.0, 0.0, shadow);
    return;
  }

  // Rune's SDF gradient and rounded shoulder normal.
  float e = 0.5 / density;
  vec2 gradient = vec2(
    distanceToPanel(p + vec2(e, 0.0)) - distanceToPanel(p - vec2(e, 0.0)),
    distanceToPanel(p + vec2(0.0, e)) - distanceToPanel(p - vec2(0.0, e))
  );
  gradient /= max(length(gradient), 0.00001);
  float bevelWidth = max(geometry.z, 0.5);
  float bevel = clamp(-sd / bevelWidth, 0.0, 1.0);
  float slope = geometry.w / bevelWidth * 3.0 * (1.0 - bevel) * (1.0 - bevel);
  vec3 normal = normalize(vec3(gradient * slope, 1.0));
  float grain = 0.5;
  if (paper > 0.5) {
    grain = paperTexture(p);
    // Tiny surface relief catches the same light as the sheet; it does not move the text.
    normal = normalize(normal + vec3(-dFdx(grain), dFdy(grain), 0.0) * density * 0.07);
  }

  // These are the same lamp, exposure and radius for every primitive.
  vec3 delta = lamp - vec3(world, geometry.y + 0.35);
  float distanceToLight = length(delta);
  vec3 direction = delta / distanceToLight;
  float sourceRadius = lamp.z * lighting.y;
  float irradiance = lighting.x * lamp.z * lamp.z /
    (dot(delta, delta) + sourceRadius * sourceRadius);
  vec3 incoming = tint * irradiance;
  float ndl = max(dot(normal, direction), 0.0);
  vec3 diffuse = incoming * ndl;

  vec3 halfway = normalize(direction + vec3(0.0, 0.0, 1.0));
  float roughSquared = material.y * material.y;
  float a = clamp(roughSquared + sourceRadius / (2.0 * distanceToLight), 0.02, 1.0);
  float energy = roughSquared / a;
  float fresnel = 0.04 + 0.96 * pow(1.0 - max(dot(direction, halfway), 0.0), 5.0);
  vec3 specular = incoming * ndl * ggx(max(dot(normal, halfway), 0.0), a)
    * energy * fresnel * material.x * 1.4;

  float rim = (1.0 - smoothstep(0.0, 1.0, -sd)) * step(0.01, edge.y);
  if (paper > 0.5) rim = 0.0;
  vec2 toLight = lamp.xy - world;
  float facing = max(dot(gradient, toLight / max(length(toLight), 0.001)), 0.0);
  specular += incoming * rim * facing * facing * max(direction.z, 0.15);

  vec3 base = oklch(albedo);
  if (paper > 0.5) {
    base *= 0.995 + (grain - 0.5) * 0.09;
  }
  float border = (1.0 - smoothstep(0.7, 1.2, -sd)) * edge.x;
  base = mix(base, vec3(1.0), border);
  vec3 ambient = vec3(lighting.z, lighting.z * 1.04, lighting.z * 1.12);
  vec3 color = base * ambient + (base + 0.04 * lift) * diffuse + specular;
  vec3 over = max(color - 0.8, 0.0);
  color = min(color, 0.8) + 0.2 * (1.0 - exp(-over / 0.2));
  color = toSrgb(color);
  float dither = noise(gl_FragCoord.xy) + noise(gl_FragCoord.yx + vec2(17.0, 0.0)) - 1.0;
  pixel = vec4(color + dither / 255.0, coverage);
}
`

export function createPanelRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', {
    alpha: true, premultipliedAlpha: true, antialias: false, depth: false,
    powerPreference: 'low-power',
  })
  if (!gl) return null

  function compile(type: number, source: string) {
    const shader = gl!.createShader(type)
    if (!shader) return null
    gl!.shaderSource(shader, source)
    gl!.compileShader(shader)
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      console.warn('Panel material:', gl!.getShaderInfoLog(shader))
      gl!.deleteShader(shader)
      return null
    }
    return shader
  }

  const vertex = compile(gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex)
    if (fragment) gl.deleteShader(fragment)
    if (program) gl.deleteProgram(program)
    return null
  }
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Panel material:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  const uniforms = Object.fromEntries([
    'viewport', 'rect', 'density', 'geometry', 'material', 'albedo', 'edge', 'lamp', 'lighting', 'tint', 'lift', 'paper',
  ].map(name => [name, gl.getUniformLocation(program, name)]))
  gl.enable(gl.BLEND)
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  return {
    draw(
      primitives: MaterialPrimitive[],
      width: number,
      height: number,
      pixelRatio: number,
      lightPosition: [number, number],
    ) {
      if (gl.isContextLost()) return false
      const maxSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)
      const density = Math.min(pixelRatio, 2, maxSize / width, maxSize / height)
      const w = Math.max(1, Math.round(width * density))
      const h = Math.max(1, Math.round(height * density))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, w, h)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.uniform2f(uniforms.viewport, width, height)
      gl.uniform1f(uniforms.density, density)
      // Scene uniforms are set once, outside the primitive draw loop.
      gl.uniform3f(uniforms.lamp, lightPosition[0], lightPosition[1], PANEL_LIGHT.height)
      gl.uniform3f(uniforms.lighting, PANEL_LIGHT.brightness, PANEL_LIGHT.softness, PANEL_LIGHT.ambient)
      gl.uniform3f(uniforms.tint, ...PANEL_LIGHT.color)
      for (const p of primitives) {
        gl.uniform4f(uniforms.rect, ...p.rect)
        gl.uniform4f(uniforms.geometry, p.radius, p.top, ...p.bevel)
        gl.uniform2f(uniforms.material, p.gloss, p.roughness)
        gl.uniform3f(uniforms.albedo, ...p.color)
        gl.uniform2f(uniforms.edge, p.border, p.rise)
        gl.uniform1f(uniforms.lift, p.lift ?? 1)
        gl.uniform1f(uniforms.paper, p.paper ? 1 : 0)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      return gl.getError() === gl.NO_ERROR
    },
    destroy() {
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    },
  }
}
