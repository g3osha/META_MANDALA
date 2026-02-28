/* Canvas-to-SVG context — converts Canvas 2D API calls to SVG markup */
class C2S {
  constructor(w, h) {
    this.width = w; this.height = h;
    this._defs = []; this._els = []; this._stack = []; this._path = [];
    this._id = 0; this._matrix = [1,0,0,1,0,0];
    this.fillStyle = '#000'; this.strokeStyle = '#000';
    this.lineWidth = 1; this.globalAlpha = 1; this.lineCap = 'butt'; this.lineJoin = 'miter';
    this.font = '10px sans-serif'; this.textAlign = 'start'; this.textBaseline = 'alphabetic';
    this.globalCompositeOperation = 'source-over';
  }

  save() {
    this._stack.push({ m:[...this._matrix], fs:this.fillStyle, ss:this.strokeStyle,
      lw:this.lineWidth, ga:this.globalAlpha, f:this.font, ta:this.textAlign,
      tb:this.textBaseline, lc:this.lineCap, lj:this.lineJoin, gco:this.globalCompositeOperation });
  }

  restore() {
    const s = this._stack.pop(); if(!s) return;
    this._matrix=s.m; this.fillStyle=s.fs; this.strokeStyle=s.ss;
    this.lineWidth=s.lw; this.globalAlpha=s.ga; this.font=s.f;
    this.textAlign=s.ta; this.textBaseline=s.tb; this.lineCap=s.lc;
    this.lineJoin=s.lj; this.globalCompositeOperation=s.gco;
  }

  _mm(b) {
    const a=this._matrix;
    this._matrix = [
      a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1],
      a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3],
      a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]
    ];
  }

  translate(x,y) { this._mm([1,0,0,1,x,y]); }
  rotate(a) { const c=Math.cos(a),s=Math.sin(a); this._mm([c,s,-s,c,0,0]); }
  scale(sx,sy) { this._mm([sx,0,0,sy||sx,0,0]); }
  setTransform(a,b,c,d,e,f) { this._matrix=[a,b,c,d,e,f]; }
  resetTransform() { this._matrix=[1,0,0,1,0,0]; }
  transform(a,b,c,d,e,f) { this._mm([a,b,c,d,e,f]); }

  _mstr() { const m=this._matrix; return `matrix(${m[0].toFixed(4)},${m[1].toFixed(4)},${m[2].toFixed(4)},${m[3].toFixed(4)},${m[4].toFixed(2)},${m[5].toFixed(2)})`; }

  beginPath() { this._path = []; }
  closePath() { this._path.push('Z'); }
  moveTo(x,y) { this._path.push(`M${x.toFixed(2)} ${y.toFixed(2)}`); }
  lineTo(x,y) { this._path.push(`L${x.toFixed(2)} ${y.toFixed(2)}`); }
  quadraticCurveTo(cx,cy,x,y) { this._path.push(`Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`); }
  bezierCurveTo(c1x,c1y,c2x,c2y,x,y) { this._path.push(`C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`); }

  arc(cx,cy,r,sa,ea,ccw) {
    if(r<=0) return;
    let da = ea - sa;
    if(ccw){ if(da>0) da -= Math.PI*2; } else { if(da<0) da += Math.PI*2; }
    const full = Math.abs(da) >= Math.PI*2 - 0.001;
    if(full) {
      const sx=cx+r*Math.cos(sa), sy=cy+r*Math.sin(sa);
      const mx=cx+r*Math.cos(sa+Math.PI), my=cy+r*Math.sin(sa+Math.PI);
      const sw = ccw?0:1;
      if(!this._path.length) this._path.push(`M${sx.toFixed(2)} ${sy.toFixed(2)}`);
      else this._path.push(`L${sx.toFixed(2)} ${sy.toFixed(2)}`);
      this._path.push(`A${r.toFixed(2)} ${r.toFixed(2)} 0 1 ${sw} ${mx.toFixed(2)} ${my.toFixed(2)}`);
      this._path.push(`A${r.toFixed(2)} ${r.toFixed(2)} 0 1 ${sw} ${sx.toFixed(2)} ${sy.toFixed(2)}`);
      return;
    }
    const x1=cx+r*Math.cos(sa), y1=cy+r*Math.sin(sa);
    const x2=cx+r*Math.cos(ea), y2=cy+r*Math.sin(ea);
    const la = Math.abs(da)>Math.PI?1:0, sw = ccw?0:1;
    if(!this._path.length) this._path.push(`M${x1.toFixed(2)} ${y1.toFixed(2)}`);
    else this._path.push(`L${x1.toFixed(2)} ${y1.toFixed(2)}`);
    this._path.push(`A${r.toFixed(2)} ${r.toFixed(2)} 0 ${la} ${sw} ${x2.toFixed(2)} ${y2.toFixed(2)}`);
  }

  arcTo(x1,y1,x2,y2,r) { this.lineTo(x1,y1); }
  rect(x,y,w,h) { this._path.push(`M${x} ${y}L${x+w} ${y}L${x+w} ${y+h}L${x} ${y+h}Z`); }

  _resolveColor(c) {
    if(c instanceof SVGGrad) { c._register(); return `url(#${c.id})`; }
    return String(c);
  }

  fill() {
    if(!this._path.length) return;
    const d = this._path.join(' ');
    this._els.push(`<path d="${d}" fill="${this._resolveColor(this.fillStyle)}" fill-opacity="${this.globalAlpha}" transform="${this._mstr()}" fill-rule="evenodd"/>`);
  }

  stroke() {
    if(!this._path.length) return;
    const d = this._path.join(' ');
    this._els.push(`<path d="${d}" fill="none" stroke="${this._resolveColor(this.strokeStyle)}" stroke-width="${this.lineWidth}" stroke-opacity="${this.globalAlpha}" stroke-linecap="${this.lineCap}" stroke-linejoin="${this.lineJoin}" transform="${this._mstr()}"/>`);
  }

  fillRect(x,y,w,h) {
    this._els.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${this._resolveColor(this.fillStyle)}" fill-opacity="${this.globalAlpha}" transform="${this._mstr()}"/>`);
  }

  strokeRect(x,y,w,h) {
    this._els.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${this._resolveColor(this.strokeStyle)}" stroke-width="${this.lineWidth}" stroke-opacity="${this.globalAlpha}" transform="${this._mstr()}"/>`);
  }

  clearRect(x,y,w,h) {
    this._els.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000" transform="${this._mstr()}"/>`);
  }

  fillText(text,x,y) {
    const anchor = {start:'start',left:'start',center:'middle',right:'end',end:'end'}[this.textAlign]||'start';
    const dy = {top:'0.8em',hanging:'0.7em',middle:'0.35em',alphabetic:'0',ideographic:'-0.2em',bottom:'-0.2em'}[this.textBaseline]||'0';
    const esc = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    this._els.push(`<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" fill="${this._resolveColor(this.fillStyle)}" fill-opacity="${this.globalAlpha}" font="${this.font}" text-anchor="${anchor}" dy="${dy}" transform="${this._mstr()}">${esc}</text>`);
  }

  strokeText(text,x,y) { this.fillText(text,x,y); }
  measureText(t) { const fs=parseFloat(this.font)||10; return {width:t.length*fs*0.6}; }

  createRadialGradient(x1,y1,r1,x2,y2,r2) { return new SVGGrad('radial',this,[x1,y1,r1,x2,y2,r2]); }
  createLinearGradient(x1,y1,x2,y2) { return new SVGGrad('linear',this,[x1,y1,x2,y2]); }
  createConicGradient() { return new SVGGrad('conic',this,arguments); }

  drawImage() {}
  createPattern() { return '#888'; }
  clip() {}
  getImageData() { return {data:new Uint8ClampedArray(4)}; }
  putImageData() {}

  toSVG() {
    const defs = this._defs.length ? `<defs>\n${this._defs.join('\n')}\n</defs>\n` : '';
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">\n${defs}${this._els.join('\n')}\n</svg>`;
  }

  get canvas() { return { width:this.width, height:this.height, toDataURL:()=>'' }; }
}

class SVGGrad {
  constructor(type, ctx, args) {
    this.type=type; this.ctx=ctx; this.args=args;
    this.id='g'+(ctx._id++); this.stops=[]; this._registered=false;
  }
  addColorStop(offset,color) { this.stops.push({offset,color}); }
  _register() {
    if(this._registered) return; this._registered=true;
    const s = this.stops.map(s=>`<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('');
    if(this.type==='radial') {
      const [x1,y1,r1,x2,y2,r2]=this.args;
      this.ctx._defs.push(`<radialGradient id="${this.id}" cx="${x2}" cy="${y2}" r="${r2}" fx="${x1}" fy="${y1}" gradientUnits="userSpaceOnUse">${s}</radialGradient>`);
    } else if(this.type==='linear') {
      const [x1,y1,x2,y2]=this.args;
      this.ctx._defs.push(`<linearGradient id="${this.id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">${s}</linearGradient>`);
    } else {
      if(this.stops.length) {
        const c = this.stops[Math.floor(this.stops.length/2)].color;
        this.ctx._defs.push(`<radialGradient id="${this.id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${this.stops[this.stops.length-1].color}"/></radialGradient>`);
      }
    }
  }
}
