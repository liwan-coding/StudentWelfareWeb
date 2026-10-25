/**
 * Silk shader from the design reference: a slow, domain-warped cloth in the
 * logo colours, leaning a little toward the pointer. Plain WebGL, no deps.
 * The loop only runs while `start()` is active and the tab is visible.
 */
const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'

const FS = [
  'precision highp float;uniform vec2 r;uniform float t;uniform vec2 m;',
  'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
  'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return v;}',
  'void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=(gl_FragCoord.xy-.5*r)/r.y;p+=(m-.5)*.18;float T=t*.16;',
  'vec2 q=vec2(fbm(p*.8+vec2(0.,T)),fbm(p*.8+vec2(5.2,1.3)-T*.8));vec2 w=p+q*1.2;',
  'float g=fbm(w*1.2+T*.3)*2.4;float ph=w.x*3.4+w.y*2.1+g+T*2.4;',
  'float f=.5+.5*sin(ph);float shade=pow(f,1.5);float sheen=pow(f,26.)+.55*pow(.5+.5*sin(ph+.42),46.);',
  'vec3 c0=vec3(.055,.03,.07),c1=vec3(.36,.13,.33),c2=vec3(.13,.47,.57),hi=vec3(1.,.86,.97);',
  'vec3 col=mix(c0,c1,shade*.85);col=mix(col,c2,smoothstep(.35,.95,q.x)*shade*.7);col+=hi*sheen*.42;',
  'col+=vec3(.5,.85,.95)*pow(.5+.5*sin(ph*.5-T),30.)*.12;',
  'col*=mix(1.,.5,smoothstep(.45,.95,uv.x)*smoothstep(.15,.6,uv.y));col*=1.-.4*pow(length(uv-vec2(.5,.45)),1.6);gl_FragColor=vec4(col,1.);}',
].join('\n')

export interface SilkHandle {
  start: () => void
  stop: () => void
  destroy: () => void
}

export function createSilk(canvas: HTMLCanvasElement, scale = 1.5): SilkHandle | null {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false })
  if (!gl) return null

  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return s
  }
  const program = gl.createProgram()!
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VS))
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FS))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(program, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const ur = gl.getUniformLocation(program, 'r')
  const ut = gl.getUniformLocation(program, 't')
  const um = gl.getUniformLocation(program, 'm')

  let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5
  let live = false
  let raf = 0
  const t0 = performance.now()

  const size = () => {
    const d = Math.min(window.devicePixelRatio || 1, scale)
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * d))
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * d))
    gl.viewport(0, 0, canvas.width, canvas.height)
  }

  const draw = (now: number) => {
    raf = 0
    mx += (tx - mx) * 0.04
    my += (ty - my) * 0.04
    gl.uniform2f(ur, canvas.width, canvas.height)
    gl.uniform1f(ut, (now - t0) / 1000)
    gl.uniform2f(um, mx, my)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    if (live && !document.hidden) raf = requestAnimationFrame(draw)
  }

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(draw)
  }

  const onResize = () => {
    size()
    kick()
  }
  const onVisibility = () => {
    if (live) kick()
  }
  const onPointer = (e: PointerEvent) => {
    const rc = canvas.getBoundingClientRect()
    tx = (e.clientX - rc.left) / (rc.width || 1)
    ty = 1 - (e.clientY - rc.top) / (rc.height || 1)
  }

  const resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(canvas)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pointermove', onPointer, { passive: true })
  size()
  draw(performance.now())

  return {
    start() {
      if (live) return
      live = true
      kick()
    },
    stop() {
      live = false
    },
    destroy() {
      live = false
      if (raf) cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointer)
      // the context is left alive: React may mount the same canvas again (StrictMode), and
      // a lost context cannot be recovered; the browser frees it with the canvas
    },
  }
}
