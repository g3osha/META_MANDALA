/* Canvas-to-SVG context — converts Canvas 2D API calls to SVG markup
   Optimized for compatibility with Photoshop, Cinema 4D, Illustrator */
class C2S {
  constructor(w, h) {
    this.width = w; this.height = h;
    this._defs = []; this._stack = []; this._path = [];
    this._id = 0; this._matrix = [1,0,0,1,0,0];
    this.fillStyle = '#000'; this.strokeStyle = '#000';
    this.lineWidth = 1; this.globalAlpha = 1; this.lineCap = 'butt'; this.lineJoin = 'miter';
    this.font = '10px sans-serif'; this.textAlign = 'start'; this.textBaseline = 'alphabetic';
    this.globalCompositeOperation = 'source-over';
    this.shadowBlur = 0; this.shadowColor = 'transparent';
    this.shadowOffsetX = 0; this.shadowOffsetY = 0;
    this.imageSmoothingEnabled = true;

    this._groups = [];
    this._root = [];
    this._current = this._root;
  }

  save() {
    this._stack.push({ m:[...this._matrix], fs:this.fillStyle, ss:this.strokeStyle,
      lw:this.lineWidth, ga:this.globalAlpha, f:this.font, ta:this.textAlign,
      tb:this.textBaseline, lc:this.lineCap, lj:this.lineJoin, gco:this.globalCompositeOperation,
      sb:this.shadowBlur, sc:this.shadowColor, sox:this.shadowOffsetX, soy:this.shadowOffsetY });
    const g = { tag:'g', attrs:this._mstr(), children:[] };
    this._current.push(g);
    this._groups.push(this._current);
    this._current = g.children;
  }

  restore() {
    const s = this._stack.pop(); if(!s) return;
    this._matrix=s.m; this.fillStyle=s.fs; this.strokeStyle=s.ss;
    this.lineWidth=s.lw; this.globalAlpha=s.ga; this.font=s.f;
    this.textAlign=s.ta; this.textBaseline=s.tb; this.lineCap=s.lc;
    this.lineJoin=s.lj; this.globalCompositeOperation=s.gco;
    this.shadowBlur=s.sb; this.shadowColor=s.sc;
    this.shadowOffsetX=s.sox; this.shadowOffsetY=s.soy;
    if(this._groups.length) this._current = this._groups.pop();
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

  _isIdentity() {
    const m=this._matrix;
    return Math.abs(m[0]-1)<1e-4 && Math.abs(m[1])<1e-4 && Math.abs(m[2])<1e-4 &&
           Math.abs(m[3]-1)<1e-4 && Math.abs(m[4])<0.01 && Math.abs(m[5])<0.01;
  }

  _mstr() {
    if(this._isIdentity()) return '';
    const m=this._matrix;
    return `matrix(${m[0].toFixed(4)},${m[1].toFixed(4)},${m[2].toFixed(4)},${m[3].toFixed(4)},${m[4].toFixed(2)},${m[5].toFixed(2)})`;
  }

  _tattr() {
    const t = this._mstr();
    return t ? ` transform="${t}"` : '';
  }

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

  ellipse(cx,cy,rx,ry,rot,sa,ea,ccw) {
    if(rx<=0||ry<=0) return;
    let da = ea - sa;
    if(ccw){ if(da>0) da -= Math.PI*2; } else { if(da<0) da += Math.PI*2; }
    const full = Math.abs(da) >= Math.PI*2 - 0.001;
    const cos=Math.cos(rot), sin=Math.sin(rot);
    function tp(t) {
      const px = rx*Math.cos(t), py = ry*Math.sin(t);
      return [cx + cos*px - sin*py, cy + sin*px + cos*py];
    }
    if(full) {
      const [sx,sy]=tp(sa), [mx,my]=tp(sa+Math.PI);
      if(!this._path.length) this._path.push(`M${sx.toFixed(2)} ${sy.toFixed(2)}`);
      else this._path.push(`L${sx.toFixed(2)} ${sy.toFixed(2)}`);
      const rd = rot*180/Math.PI, sw = ccw?0:1;
      this._path.push(`A${rx.toFixed(2)} ${ry.toFixed(2)} ${rd.toFixed(2)} 1 ${sw} ${mx.toFixed(2)} ${my.toFixed(2)}`);
      this._path.push(`A${rx.toFixed(2)} ${ry.toFixed(2)} ${rd.toFixed(2)} 1 ${sw} ${sx.toFixed(2)} ${sy.toFixed(2)}`);
      return;
    }
    const [x1,y1]=tp(sa), [x2,y2]=tp(ea);
    const la = Math.abs(da)>Math.PI?1:0, sw = ccw?0:1;
    const rd = rot*180/Math.PI;
    if(!this._path.length) this._path.push(`M${x1.toFixed(2)} ${y1.toFixed(2)}`);
    else this._path.push(`L${x1.toFixed(2)} ${y1.toFixed(2)}`);
    this._path.push(`A${rx.toFixed(2)} ${ry.toFixed(2)} ${rd.toFixed(2)} ${la} ${sw} ${x2.toFixed(2)} ${y2.toFixed(2)}`);
  }

  _resolveColor(c) {
    if(c instanceof SVGGrad) { c._register(); return `url(#${c.id})`; }
    return String(c);
  }

  _oattr(alpha) {
    return (alpha < 0.999) ? ` opacity="${alpha.toFixed(3)}"` : '';
  }

  fill() {
    if(!this._path.length) return;
    const d = this._path.join(' ');
    this._current.push(`<path d="${d}" fill="${this._resolveColor(this.fillStyle)}"${this._oattr(this.globalAlpha)}${this._tattr()} fill-rule="evenodd"/>`);
  }

  stroke() {
    if(!this._path.length) return;
    const d = this._path.join(' ');
    this._current.push(`<path d="${d}" fill="none" stroke="${this._resolveColor(this.strokeStyle)}" stroke-width="${this.lineWidth.toFixed(2)}"${this._oattr(this.globalAlpha)} stroke-linecap="${this.lineCap}" stroke-linejoin="${this.lineJoin}"${this._tattr()}/>`);
  }

  fillRect(x,y,w,h) {
    this._current.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${this._resolveColor(this.fillStyle)}"${this._oattr(this.globalAlpha)}${this._tattr()}/>`);
  }

  strokeRect(x,y,w,h) {
    this._current.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${this._resolveColor(this.strokeStyle)}" stroke-width="${this.lineWidth}"${this._oattr(this.globalAlpha)}${this._tattr()}/>`);
  }

  clearRect() {}

  _parseFont(f) {
    const m = f.match(/(?:(?:bold|italic|normal)\s+)*(\d+(?:\.\d+)?)(px|pt|em)\s+(.*)/i);
    if(!m) return { size:'10', family:'sans-serif' };
    return { size:m[1], family:m[3].replace(/'/g,'') };
  }

  fillText(text,x,y) {
    const anchor = {start:'start',left:'start',center:'middle',right:'end',end:'end'}[this.textAlign]||'start';
    const dy = {top:'0.8em',hanging:'0.7em',middle:'0.35em',alphabetic:'0',ideographic:'-0.2em',bottom:'-0.2em'}[this.textBaseline]||'0';
    const esc = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const pf = this._parseFont(this.font);
    this._current.push(`<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" fill="${this._resolveColor(this.fillStyle)}"${this._oattr(this.globalAlpha)} font-family="${pf.family}" font-size="${pf.size}" text-anchor="${anchor}" dy="${dy}"${this._tattr()}>${esc}</text>`);
  }

  strokeText(text,x,y) {
    const anchor = {start:'start',left:'start',center:'middle',right:'end',end:'end'}[this.textAlign]||'start';
    const dy = {top:'0.8em',hanging:'0.7em',middle:'0.35em',alphabetic:'0',ideographic:'-0.2em',bottom:'-0.2em'}[this.textBaseline]||'0';
    const esc = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const pf = this._parseFont(this.font);
    this._current.push(`<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" fill="none" stroke="${this._resolveColor(this.strokeStyle)}" stroke-width="${this.lineWidth}"${this._oattr(this.globalAlpha)} font-family="${pf.family}" font-size="${pf.size}" text-anchor="${anchor}" dy="${dy}"${this._tattr()}>${esc}</text>`);
  }

  measureText(t) { const fs=parseFloat(this.font)||10; return {width:t.length*fs*0.6}; }

  createRadialGradient(x1,y1,r1,x2,y2,r2) { return new SVGGrad('radial',this,[x1,y1,r1,x2,y2,r2]); }
  createLinearGradient(x1,y1,x2,y2) { return new SVGGrad('linear',this,[x1,y1,x2,y2]); }
  createConicGradient() { return new SVGGrad('conic',this,arguments); }

  drawImage() {}
  createPattern() { return '#888'; }
  clip() {}
  getImageData() { return {data:new Uint8ClampedArray(4)}; }
  putImageData() {}

  _renderTree(nodes) {
    const out = [];
    for(const n of nodes) {
      if(typeof n === 'string') { out.push(n); continue; }
      if(!n.children.length) continue;
      if(n.attrs) {
        out.push(`<g transform="${n.attrs}">`);
        out.push(...this._renderTree(n.children));
        out.push('</g>');
      } else {
        out.push(...this._renderTree(n.children));
      }
    }
    return out;
  }

  toSVG() {
    const defs = this._defs.length ? `<defs>\n${this._defs.join('\n')}\n</defs>\n` : '';
    const body = this._renderTree(this._root).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">\n${defs}${body}\n</svg>`;
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
    const s = this.stops.map(s=>`<stop offset="${(s.offset*100).toFixed(1)}%" stop-color="${s.color}"/>`).join('');
    if(this.type==='radial') {
      const [x1,y1,r1,x2,y2,r2]=this.args;
      this.ctx._defs.push(`<radialGradient id="${this.id}" cx="${x2}" cy="${y2}" r="${r2}" fx="${x1}" fy="${y1}" gradientUnits="userSpaceOnUse">${s}</radialGradient>`);
    } else if(this.type==='linear') {
      const [x1,y1,x2,y2]=this.args;
      this.ctx._defs.push(`<linearGradient id="${this.id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">${s}</linearGradient>`);
    } else {
      if(this.stops.length) {
        const c = this.stops[Math.floor(this.stops.length/2)].color;
        this.ctx._defs.push(`<radialGradient id="${this.id}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${this.stops[this.stops.length-1].color}"/></radialGradient>`);
      }
    }
  }
}
