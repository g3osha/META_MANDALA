class GlitchEngine {
  constructor(sourceCanvas, glitchCanvas) {
    this.source = sourceCanvas;
    this.canvas = glitchCanvas;
    this.ctx = glitchCanvas.getContext('2d');
    this.width = glitchCanvas.width;
    this.height = glitchCanvas.height;

    this.params = {
      rgbShift: 0, noise: 0, scanlines: 20,
      distortion: 0, pixelate: 1, flicker: 0
    };

    this.colorCorrection = {
      hueRotate: 0, saturation: 100, brightness: 100, contrast: 100, invert: 0
    };

    this.animating = false;
    this.animFrame = null;
    this.time = 0;
  }

  setParam(key, value) { this.params[key] = value; }
  setColorCorrection(key, value) { this.colorCorrection[key] = value; }

  hasGlitchEffects() {
    const p = this.params;
    return p.rgbShift > 0 || p.noise > 0 || p.scanlines > 0 || p.distortion > 0 ||
           p.pixelate > 1 || p.flicker > 0;
  }

  hasActiveEffects() {
    const p = this.params, cc = this.colorCorrection;
    return p.rgbShift > 0 || p.noise > 0 || p.scanlines > 0 || p.distortion > 0 ||
           p.pixelate > 1 || p.flicker > 0 || cc.hueRotate !== 0 || cc.saturation !== 100 ||
           cc.brightness !== 100 || cc.contrast !== 100 || cc.invert !== 0;
  }

  hasColorCorrection() {
    const cc = this.colorCorrection;
    return cc.hueRotate !== 0 || cc.saturation !== 100 || cc.brightness !== 100 ||
           cc.contrast !== 100 || cc.invert !== 0;
  }

  apply() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    if (!this.hasGlitchEffects()) return;

    ctx.drawImage(this.source, 0, 0);

    const p = this.params;
    if (p.pixelate > 1) this._applyPixelate(ctx, p.pixelate);
    if (p.rgbShift > 0) this._applyRGBShift(ctx, p.rgbShift);
    if (p.distortion > 0) this._applyDistortion(ctx, p.distortion);
    if (p.noise > 0) this._applyNoise(ctx, p.noise);
    if (p.scanlines > 0) this._applyScanlines(ctx, p.scanlines);
    if (p.flicker > 0) this._applyFlicker(ctx, p.flicker);
  }

  applyToCanvas(targetCtx, sourceCanvas, w, h) {
    const orig = { width: this.width, height: this.height, canvas: this.canvas, ctx: this.ctx };
    try {
      this.width = w; this.height = h;
      this.canvas = targetCtx.canvas; this.ctx = targetCtx;
      targetCtx.drawImage(sourceCanvas, 0, 0, w, h);

      const p = this.params;
      if (p.pixelate > 1) this._applyPixelate(targetCtx, p.pixelate);
      if (p.rgbShift > 0) this._applyRGBShift(targetCtx, p.rgbShift);
      if (p.distortion > 0) this._applyDistortion(targetCtx, p.distortion);
      if (p.noise > 0) this._applyNoise(targetCtx, p.noise);
      if (p.scanlines > 0) this._applyScanlines(targetCtx, p.scanlines);
      this._applyColorCorrection(targetCtx);
    } finally {
      this.width = orig.width; this.height = orig.height;
      this.canvas = orig.canvas; this.ctx = orig.ctx;
    }
  }

  applyEffectsToCanvas(targetCtx, sourceCanvas, w, h) {
    const orig = { width: this.width, height: this.height, canvas: this.canvas, ctx: this.ctx };
    try {
      this.width = w; this.height = h;
      this.canvas = targetCtx.canvas; this.ctx = targetCtx;
      targetCtx.clearRect(0, 0, w, h);
      targetCtx.drawImage(sourceCanvas, 0, 0, w, h);

      const p = this.params;
      if (p.pixelate > 1) this._applyPixelate(targetCtx, p.pixelate);
      if (p.rgbShift > 0) this._applyRGBShift(targetCtx, p.rgbShift);
      if (p.distortion > 0) this._applyDistortion(targetCtx, p.distortion);
      if (p.noise > 0) this._applyNoise(targetCtx, p.noise);
      if (p.scanlines > 0) this._applyScanlines(targetCtx, p.scanlines);
      if (p.flicker > 0) this._applyFlicker(targetCtx, p.flicker);
    } finally {
      this.width = orig.width; this.height = orig.height;
      this.canvas = orig.canvas; this.ctx = orig.ctx;
    }
  }

  applyColorCorrectionToCanvas(targetCtx, w, h) {
    const orig = { width: this.width, height: this.height, canvas: this.canvas, ctx: this.ctx };
    try {
      this.width = w; this.height = h;
      this.canvas = targetCtx.canvas; this.ctx = targetCtx;
      this._applyColorCorrection(targetCtx);
    } finally {
      this.width = orig.width; this.height = orig.height;
      this.canvas = orig.canvas; this.ctx = orig.ctx;
    }
  }

  _applyColorCorrection(ctx) {
    const cc = this.colorCorrection;
    const hasCC = cc.hueRotate!==0||cc.saturation!==100||cc.brightness!==100||cc.contrast!==100||cc.invert!==0;
    if (!hasCC) return;
    const id = ctx.getImageData(0, 0, this.width, this.height);
    const d = id.data;
    const satMul = cc.saturation / 100;
    const brightMul = cc.brightness / 100;
    const contrastMul = cc.contrast / 100;
    const invertAmt = cc.invert / 100;
    const hueShift = (cc.hueRotate % 360) / 360;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i] / 255;
      let g = d[i + 1] / 255;
      let b = d[i + 2] / 255;

      let [h, s, l] = this._rgbToHsl(r, g, b);
      h = (h + hueShift + 1) % 1;
      s = Math.max(0, Math.min(1, s * satMul));
      [r, g, b] = this._hslToRgb(h, s, l);

      r *= brightMul;
      g *= brightMul;
      b *= brightMul;

      r = (r - 0.5) * contrastMul + 0.5;
      g = (g - 0.5) * contrastMul + 0.5;
      b = (b - 0.5) * contrastMul + 0.5;

      if (invertAmt > 0) {
        r = r * (1 - invertAmt) + (1 - r) * invertAmt;
        g = g * (1 - invertAmt) + (1 - g) * invertAmt;
        b = b * (1 - invertAmt) + (1 - b) * invertAmt;
      }

      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));

      d[i] = Math.round(r * 255);
      d[i + 1] = Math.round(g * 255);
      d[i + 2] = Math.round(b * 255);
    }

    ctx.putImageData(id, 0, 0);
  }

  _rgbToHsl(r, g, b) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
    return [h, s, l];
  }

  _hslToRgb(h, s, l) {
    if (s === 0) return [l, l, l];
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
      hue2rgb(p, q, h + 1/3),
      hue2rgb(p, q, h),
      hue2rgb(p, q, h - 1/3)
    ];
  }

  _applyRGBShift(ctx, amount) {
    const id = ctx.getImageData(0,0,this.width,this.height), d = id.data;
    const shift = Math.floor(amount), cp = new Uint8ClampedArray(d);
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      const idx = (y*this.width+x)*4;
      d[idx] = cp[(y*this.width+Math.min(x+shift,this.width-1))*4];
      d[idx+2] = cp[(y*this.width+Math.max(x-shift,0))*4+2];
    }
    ctx.putImageData(id,0,0);
  }

  _applyNoise(ctx, amount) {
    const id = ctx.getImageData(0,0,this.width,this.height), d = id.data, int = amount/100;
    for (let i = 0; i < d.length; i+=4) {
      if (Math.random() < int*0.3) {
        const n = (Math.random()-0.5)*255*int;
        d[i]+=n; d[i+1]+=n; d[i+2]+=n;
      }
    }
    ctx.putImageData(id,0,0);
  }

  _applyScanlines(ctx, amount) {
    ctx.fillStyle = `rgba(0,0,0,${(amount/100)*0.15})`;
    for (let y = 0; y < this.height; y+=3) ctx.fillRect(0,y,this.width,1);
  }

  _applyDistortion(ctx, amount) {
    const id = ctx.getImageData(0,0,this.width,this.height), d = id.data;
    const cp = new Uint8ClampedArray(d), int = amount/50;
    for (let y = 0; y < this.height; y++) {
      const off = Math.floor(Math.sin(y*0.05+this.time*0.01)*amount*int);
      for (let x = 0; x < this.width; x++) {
        const sx = Math.min(Math.max(x+off,0),this.width-1);
        const di = (y*this.width+x)*4, si = (y*this.width+sx)*4;
        d[di]=cp[si]; d[di+1]=cp[si+1]; d[di+2]=cp[si+2]; d[di+3]=cp[si+3];
      }
    }
    ctx.putImageData(id,0,0);
  }

  _applyPixelate(ctx, size) {
    const tc = document.createElement('canvas');
    tc.width = Math.ceil(this.width/size); tc.height = Math.ceil(this.height/size);
    tc.getContext('2d').drawImage(this.canvas,0,0,tc.width,tc.height);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0,0,this.width,this.height);
    ctx.drawImage(tc,0,0,this.width,this.height);
    ctx.imageSmoothingEnabled = true;
  }

  _applyFlicker(ctx, amount) {
    const int = amount/100;
    if (Math.random()<int*0.3) { ctx.fillStyle=`rgba(255,255,255,${Math.random()*int*0.1})`; ctx.fillRect(0,0,this.width,this.height); }
    if (Math.random()<int*0.1) { const y=Math.random()*this.height; ctx.fillStyle=`rgba(0,0,0,${Math.random()*0.5})`; ctx.fillRect(0,y,this.width,Math.random()*20+5); }
  }

  glitchBurst() {
    const orig = {...this.params};
    this.params.rgbShift=15+Math.random()*15; this.params.noise=40+Math.random()*40;
    this.params.distortion=20+Math.random()*30; this.params.flicker=60;
    this.apply();
    setTimeout(() => { Object.assign(this.params, orig); this.apply(); }, 200);
  }

  startAnimation() { if (this.animating) return; this.animating=true; this._animate(); }
  stopAnimation() { this.animating=false; if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame=null; } }
  _animate() { if (!this.animating) return; this.time++; this.apply(); this.animFrame=requestAnimationFrame(()=>this._animate()); }
}
