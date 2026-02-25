const PALETTES = {
  samsara: { bg:'#0a0a1a', colors:['#6b2fa0','#9b59b6','#e6a800','#f0c040','#c44569','#a29bfe'], stroke:'#e6a80044' },
  void:    { bg:'#050508', colors:['#1a1a3e','#2a2a5e','#444','#666','#888','#aaa'], stroke:'#ffffff22' },
  lotus:   { bg:'#1a0a10', colors:['#ff6b9d','#c44569','#f8b500','#e55039','#ff9ff3','#feca57'], stroke:'#ff6b9d44' },
  dharma:  { bg:'#0a1a10', colors:['#00b894','#006266','#f6e58d','#badc58','#6ab04c','#c7ecee'], stroke:'#00b89444' },
  fire:    { bg:'#1a0a05', colors:['#eb4d4b','#f0932b','#f9ca24','#e55039','#ff6348','#ffbe76'], stroke:'#eb4d4b44' },
  ice:     { bg:'#0a0a1f', colors:['#a29bfe','#74b9ff','#dfe6e9','#81ecec','#55efc4','#636e72'], stroke:'#a29bfe44' }
};

const TRADITIONS = {
  vajrayana: { rings:6, petals:8, symmetry:8, complexity:6, shapes:['circle','square','diamond'], palette:'samsara', fractalDepth:0, lineWidth:1, innerRotation:0 },
  theravada: { rings:4, petals:8, symmetry:4, complexity:3, shapes:['circle'], palette:'dharma', fractalDepth:0, lineWidth:1, innerRotation:0 },
  zen:       { rings:3, petals:12, symmetry:1, complexity:2, shapes:['circle'], palette:'void', fractalDepth:0, lineWidth:2, innerRotation:0 },
  tibetan:   { rings:8, petals:8, symmetry:8, complexity:8, shapes:['circle','square','triangle','lotus'], palette:'samsara', fractalDepth:0, lineWidth:1, innerRotation:0 },
  shingon:   { rings:5, petals:12, symmetry:12, complexity:7, shapes:['circle','lotus','diamond'], palette:'fire', fractalDepth:0, lineWidth:1, innerRotation:0 },
  fractal:   { rings:3, petals:3, symmetry:3, complexity:2, shapes:['triangle'], palette:'ice', fractalDepth:5, lineWidth:0.6, innerRotation:0 },
  custom:    { rings:6, petals:8, symmetry:8, complexity:5, shapes:['circle','square'], palette:'samsara', fractalDepth:0, lineWidth:1, innerRotation:0 }
};

const MANTRAS = {
  om_mani:   { text:'ॐ मणि पद्मे हूँ', chars:['ॐ','म','णि','प','द्मे','हूँ'] },
  gate_gate: { text:'गते गते पारगते बोधि स्वाहा', chars:['ग','ते','पा','र','सं','बो','धि','स्वा','हा'] },
  om_tare:   { text:'ॐ तारे तुत्तारे तुरे स्वाहा', chars:['ॐ','ता','रे','तु','त्ता','रे','स्वा','हा'] },
  tayata:    { text:'तद्यथा ॐ बेकन्द्ज़े', chars:['त','द्य','था','ॐ','बे','क','न्द्ज़े'] },
  nam_myoho: { text:'南無妙法蓮華經', chars:['南','無','妙','法','蓮','華','經'] },
  om_ah_hum: { text:'ॐ आः हूँ वज्र गुरु', chars:['ॐ','आः','हूँ','व','ज्र','गु','रु'] },
  custom_mantra: { text:'', chars:[] }
};

const SACRED_OBJECTS = {
  none: null,
  buddha: { name:'Buddha', draw(c,s,l){c.lineWidth=l;c.beginPath();c.arc(0,-s*.32,s*.14,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,-s*.47,s*.05,Math.PI,0);c.stroke();c.beginPath();c.moveTo(0,-s*.18);c.lineTo(-s*.3,s*.35);c.quadraticCurveTo(0,s*.28,s*.3,s*.35);c.closePath();c.stroke();c.beginPath();c.ellipse(0,s*.1,s*.13,s*.06,0,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,-s*.34,s*.015,0,Math.PI*2);c.fill();}},
  eye: { name:'Third Eye', draw(c,s,l){c.lineWidth=l;c.beginPath();c.moveTo(-s*.4,0);c.quadraticCurveTo(0,-s*.3,s*.4,0);c.quadraticCurveTo(0,s*.3,-s*.4,0);c.stroke();c.beginPath();c.arc(0,0,s*.12,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,s*.04,0,Math.PI*2);c.fill();}},
  dharmachakra: { name:'Dharma Wheel', draw(c,s,l){c.lineWidth=l;c.beginPath();c.arc(0,0,s*.4,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,s*.12,0,Math.PI*2);c.stroke();for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;c.beginPath();c.moveTo(Math.cos(a)*s*.12,Math.sin(a)*s*.12);c.lineTo(Math.cos(a)*s*.4,Math.sin(a)*s*.4);c.stroke();}c.beginPath();c.arc(0,0,s*.04,0,Math.PI*2);c.fill();}},
  stupa: { name:'Stupa', draw(c,s,l){c.lineWidth=l;c.strokeRect(-s*.28,s*.2,s*.56,s*.12);c.beginPath();c.moveTo(-s*.22,s*.2);c.quadraticCurveTo(-s*.22,-s*.08,0,-s*.12);c.quadraticCurveTo(s*.22,-s*.08,s*.22,s*.2);c.stroke();c.strokeRect(-s*.07,-s*.22,s*.14,s*.1);c.beginPath();c.moveTo(0,-s*.5);c.lineTo(-s*.05,-s*.22);c.moveTo(0,-s*.5);c.lineTo(s*.05,-s*.22);c.stroke();}},
  vajra: { name:'Vajra', draw(c,s,l){c.lineWidth=l;c.beginPath();c.arc(0,0,s*.06,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(0,-s*.06);c.lineTo(0,-s*.42);c.moveTo(-s*.1,-s*.08);c.quadraticCurveTo(-s*.13,-s*.28,0,-s*.42);c.moveTo(s*.1,-s*.08);c.quadraticCurveTo(s*.13,-s*.28,0,-s*.42);c.stroke();c.beginPath();c.moveTo(0,s*.06);c.lineTo(0,s*.42);c.moveTo(-s*.1,s*.08);c.quadraticCurveTo(-s*.13,s*.28,0,s*.42);c.moveTo(s*.1,s*.08);c.quadraticCurveTo(s*.13,s*.28,0,s*.42);c.stroke();}},
  deer: { name:'Deer', draw(c,s,l){c.lineWidth=l;c.beginPath();c.ellipse(0,s*.05,s*.22,s*.1,0,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(s*.18,-s*.03);c.quadraticCurveTo(s*.22,-s*.22,s*.18,-s*.32);c.stroke();c.beginPath();c.arc(s*.18,-s*.36,s*.055,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(s*.15,-s*.41);c.lineTo(s*.08,-s*.55);c.moveTo(s*.21,-s*.41);c.lineTo(s*.28,-s*.55);c.stroke();c.beginPath();c.moveTo(-s*.12,s*.13);c.lineTo(-s*.15,s*.38);c.moveTo(-s*.02,s*.14);c.lineTo(-s*.02,s*.38);c.moveTo(s*.08,s*.14);c.lineTo(s*.08,s*.38);c.moveTo(s*.17,s*.1);c.lineTo(s*.19,s*.38);c.stroke();}},
  elephant: { name:'Elephant', draw(c,s,l){c.lineWidth=l;c.beginPath();c.ellipse(-s*.05,0,s*.25,s*.16,0,0,Math.PI*2);c.stroke();c.beginPath();c.arc(s*.2,-s*.12,s*.13,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(s*.32,-s*.06);c.quadraticCurveTo(s*.42,s*.02,s*.38,s*.15);c.quadraticCurveTo(s*.35,s*.22,s*.28,s*.18);c.stroke();c.beginPath();c.moveTo(-s*.18,s*.14);c.lineTo(-s*.2,s*.38);c.moveTo(-s*.06,s*.16);c.lineTo(-s*.06,s*.38);c.moveTo(s*.08,s*.16);c.lineTo(s*.06,s*.38);c.moveTo(s*.18,s*.12);c.lineTo(s*.18,s*.38);c.stroke();}},
  moon: { name:'Moon', draw(c,s,l){c.lineWidth=l;c.beginPath();c.arc(0,0,s*.35,0,Math.PI*2);c.stroke();c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.arc(s*.12,-s*.05,s*.24,0,Math.PI*2);c.fill();c.restore();c.beginPath();c.arc(s*.12,-s*.05,s*.24,0,Math.PI*2);c.stroke();}},
  tree: { name:'Bodhi Tree', draw(c,s,l){c.lineWidth=l;c.beginPath();c.moveTo(-s*.025,s*.4);c.lineTo(-s*.015,-s*.08);c.moveTo(s*.025,s*.4);c.lineTo(s*.015,-s*.08);c.stroke();for(let i=0;i<3;i++){const y=-s*.12-i*s*.11,w=s*(.22-i*.04);c.beginPath();c.moveTo(0,y-s*.08);c.quadraticCurveTo(-w,y-s*.04,-w*.7,y+s*.04);c.quadraticCurveTo(0,y+s*.06,w*.7,y+s*.04);c.quadraticCurveTo(w,y-s*.04,0,y-s*.08);c.stroke();}}},
  om: { name:'Om ॐ', draw(c,s,l){c.lineWidth=l;c.font=`${s*.7}px serif`;c.textAlign='center';c.textBaseline='middle';c.strokeText('ॐ',0,0);}}
};

class MandalaEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.params = {
      rings:6, petals:8, symmetry:8, complexity:5, scale:80,
      shapes: new Set(['circle','square']),
      palette:'samsara', tradition:'vajrayana',
      mantra:'om_mani', mantraEncoding:'spiral', mantraOpacity:0.4,
      customMantra:'',
      seed: Math.random()*99999,
      rotation:0, fractalDepth:0, lineWidth:1,
      innerRotation:0, strokeOnly:false, filledMode:false,
      objects:{type:'none',count:1,size:25,ring:0,style:'stroke',opacity:0.8},
      customGradient:{enabled:false,color1:'#6b2fa0',color2:'#e6a800',color3:'#ff6b9d',bg:'#0a0a1a',bgType:'radial'},
      customText:'', customTextSize:12, customTextRing:5
    };

    this.uploadedImage = null;
    this._processedImage = null;
    this.imageParams = {
      blend:'source-over', opacity:0.5, fragments:8,
      rotation:0, kaleidoscope:false, threshold:0,
      edgeDetect:false, mirror:'none'
    };
  }

  setParam(k,v){ this.params[k]=v; }

  setTradition(key) {
    const t=TRADITIONS[key]; if(!t) return;
    this.params.tradition=key;
    if(key!=='custom'){
      this.params.rings=t.rings; this.params.petals=t.petals;
      this.params.symmetry=t.symmetry; this.params.complexity=t.complexity;
      this.params.shapes=new Set(t.shapes); this.params.palette=t.palette;
      this.params.fractalDepth=t.fractalDepth; this.params.lineWidth=t.lineWidth;
      this.params.innerRotation=t.innerRotation;
    }
  }

  getPalette() {
    if(this.params.customGradient.enabled){
      const g=this.params.customGradient;
      return { bg:g.bg, colors:this._interpColors(g.color1,g.color2,g.color3,6), stroke:g.color1+'44' };
    }
    return PALETTES[this.params.palette]||PALETTES.samsara;
  }

  _lerp(c1,c2,t){
    const p=(c,i)=>parseInt(c.slice(1+i*2,3+i*2),16);
    const r=Math.round(p(c1,0)+(p(c2,0)-p(c1,0))*t);
    const g=Math.round(p(c1,1)+(p(c2,1)-p(c1,1))*t);
    const b=Math.round(p(c1,2)+(p(c2,2)-p(c1,2))*t);
    return `#${((r<0?0:r>255?255:r)<<16|(g<0?0:g>255?255:g)<<8|(b<0?0:b>255?255:b)).toString(16).padStart(6,'0')}`;
  }

  _interpColors(c1,c2,c3,n){
    const o=[]; for(let i=0;i<n;i++){const t=i/(n-1);o.push(t<.5?this._lerp(c1,c2,t*2):this._lerp(c2,c3,(t-.5)*2));}return o;
  }

  seededRandom(){ this.params.seed=(this.params.seed*9301+49297)%233280; return this.params.seed/233280; }
  resetSeed(s){ this.params.seed=s||Math.random()*99999; }

  renderToCanvas(target, seed) {
    const o = { canvas:this.canvas, ctx:this.ctx, width:this.width, height:this.height };
    try {
      this.canvas=target; this.ctx=target.getContext('2d');
      this.width=target.width; this.height=target.height;
      this.generate(seed);
    } finally {
      this.canvas=o.canvas; this.ctx=o.ctx; this.width=o.width; this.height=o.height;
    }
  }

  // ──── MAIN GENERATE ────
  // ALL drawing is relative to (0,0)=center after the single translate.
  // No sub-method ever calls translate(cx,cy).
  generate(seed) {
    this.resetSeed(seed);
    const ctx=this.ctx, pal=this.getPalette();
    const W=this.width, H=this.height;
    const cx=W/2, cy=H/2;
    const maxR=Math.min(cx,cy)*0.9;
    this._sf = W / 800;
    const {rings,petals,symmetry,complexity,scale,shapes,rotation}=this.params;
    const r=maxR*(scale/100);
    const rotRad=(rotation||0)*Math.PI/180;

    // Background (absolute coordinates, before translate)
    ctx.clearRect(0,0,W,H);
    const cg=this.params.customGradient;
    if(cg.enabled && cg.bgType!=='flat'){
      this._bgGradient(ctx,pal,r,cx,cy,W,H);
    } else {
      ctx.fillStyle=pal.bg; ctx.fillRect(0,0,W,H);
    }

    // Everything below is centered at (0,0)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotRad);

    // Filled mode: colored concentric rings
    if(this.params.filledMode){
      for(let i=rings;i>0;i--){
        const rr=r*(i/rings);
        ctx.fillStyle=pal.colors[i%pal.colors.length]+'44';
        ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2); ctx.fill();
      }
    }

    this._outerProtection(ctx,pal,r);

    if(this.params.fractalDepth>0 && shapes.has('triangle'))
      this._fractalTriangles(ctx,pal,r);

    for(let ring=0;ring<rings;ring++){
      const rr=r*((rings-ring)/rings), prog=ring/rings, ci=ring%pal.colors.length;
      ctx.save();
      if(this.params.innerRotation) ctx.rotate(this.params.innerRotation*ring*Math.PI/180);

      if(shapes.has('square')&&ring%3===0) this._squareGate(ctx,rr,pal,ci,prog);
      if(shapes.has('triangle')&&this.params.fractalDepth===0&&ring%2===1) this._triangles(ctx,rr,pal,ci,symmetry);
      if(shapes.has('circle')) this._circleRing(ctx,rr,pal,ci,petals);
      if(shapes.has('lotus')) this._lotus(ctx,rr*.8,pal,ci,petals);
      if(shapes.has('diamond')) this._diamonds(ctx,rr*.6,pal,ci,symmetry);
      if(shapes.has('star')) this._stars(ctx,rr*.7,pal,ci,symmetry);
      for(let c=0;c<complexity;c++) this._detailDots(ctx,rr,pal,symmetry,c);

      ctx.restore();
    }

    this._center(ctx,pal,r*.08);
    this._sacredObjects(ctx,pal,r);
    this._mantra(ctx,pal,r);
    this._customText(ctx,pal,r);

    // Image mandala (also at 0,0)
    if(this.uploadedImage) this._imageMandala(ctx,r);

    ctx.restore();
  }

  // ──── BACKGROUND ────
  _bgGradient(ctx,pal,r,cx,cy,W,H){
    const g=this.params.customGradient;
    if(g.bgType==='radial'){
      const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,r*1.3);
      gr.addColorStop(0,g.color1);gr.addColorStop(.5,g.color2);gr.addColorStop(1,g.color3);
      ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
    }else if(g.bgType==='linear'){
      const gr=ctx.createLinearGradient(0,0,W,H);
      gr.addColorStop(0,g.color1);gr.addColorStop(.5,g.color2);gr.addColorStop(1,g.color3);
      ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
    }else if(g.bgType==='conic'){
      for(let i=0;i<72;i++){
        const t=i/72,a1=t*Math.PI*2,a2=((i+1)/72)*Math.PI*2;
        ctx.fillStyle=t<.33?this._lerp(g.color1,g.color2,t*3):t<.66?this._lerp(g.color2,g.color3,(t-.33)*3):this._lerp(g.color3,g.color1,(t-.66)*3);
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r*1.5,a1,a2);ctx.closePath();ctx.fill();
      }
    }
  }

  // ──── OUTER PROTECTION ────
  _outerProtection(ctx,pal,r){
    const lw=this.params.lineWidth*this._sf, s=this._sf;
    ctx.strokeStyle=pal.stroke; ctx.lineWidth=lw;
    ctx.beginPath(); ctx.arc(0,0,r+10*s,0,Math.PI*2); ctx.stroke();
    ctx.lineWidth=lw*.5;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,r+(15+i*5)*s,0,Math.PI*2);ctx.stroke();}
    for(let i=0;i<72;i++){
      const a=(i/72)*Math.PI*2,ir=r+15*s,fh=(8+Math.sin(i*5)*4)*s;
      ctx.save();ctx.rotate(a);
      ctx.fillStyle=pal.colors[i%pal.colors.length]+'33';
      ctx.beginPath();ctx.moveTo(0,-ir);
      ctx.quadraticCurveTo(fh*.5,-(ir+fh*.6),0,-(ir+fh));
      ctx.quadraticCurveTo(-fh*.5,-(ir+fh*.6),0,-ir);ctx.fill();ctx.restore();
    }
  }

  // ──── FRACTALS ────
  _fractalTriangles(ctx,pal,r){
    const d=this.params.fractalDepth,sym=this.params.symmetry,lw=this.params.lineWidth,so=this.params.strokeOnly,fm=this.params.filledMode;
    for(let s=0;s<sym;s++){
      ctx.save();ctx.rotate((s/sym)*Math.PI*2);
      const t=r*.85;
      this._sierpinski(ctx,0,-t,-t*Math.sin(Math.PI/3),t*.5,t*Math.sin(Math.PI/3),t*.5,d,pal,0,lw*this._sf,so,fm);
      ctx.restore();
    }
  }

  _sierpinski(ctx,ax,ay,bx,by,cx2,cy2,d,pal,co,lw,so,fm){
    if(d<=0){
      const ci=co%pal.colors.length;
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(cx2,cy2);ctx.closePath();
      if(fm||!so){ctx.fillStyle=pal.colors[ci]+(fm?'55':'22');ctx.fill();}
      ctx.strokeStyle=pal.colors[ci]+(so?'aa':'66');ctx.lineWidth=lw;ctx.stroke();
      return;
    }
    const mx1=(ax+bx)/2,my1=(ay+by)/2,mx2=(bx+cx2)/2,my2=(by+cy2)/2,mx3=(ax+cx2)/2,my3=(ay+cy2)/2;
    this._sierpinski(ctx,ax,ay,mx1,my1,mx3,my3,d-1,pal,co,lw,so,fm);
    this._sierpinski(ctx,mx1,my1,bx,by,mx2,my2,d-1,pal,co+1,lw,so,fm);
    this._sierpinski(ctx,mx3,my3,mx2,my2,cx2,cy2,d-1,pal,co+2,lw,so,fm);
  }

  // ──── SHAPES ────
  _squareGate(ctx,r,pal,ci,prog){
    const sz=r*1.05,gw=sz*.2,lw=this.params.lineWidth*this._sf,fm=this.params.filledMode;
    ctx.save();ctx.rotate(Math.PI/4*prog);
    if(fm){ctx.fillStyle=pal.colors[ci]+'33';ctx.fillRect(-sz/2,-sz/2,sz,sz);}
    ctx.strokeStyle=pal.colors[ci]+'88';ctx.lineWidth=lw*1.5;
    ctx.strokeRect(-sz/2,-sz/2,sz,sz);
    ctx.fillStyle=pal.colors[(ci+1)%pal.colors.length]+(fm?'55':'22');
    [{x:0,y:-sz/2,r:0},{x:sz/2,y:0,r:Math.PI/2},{x:0,y:sz/2,r:Math.PI},{x:-sz/2,y:0,r:-Math.PI/2}].forEach(d=>{
      ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.r);
      ctx.beginPath();ctx.moveTo(-gw/2,0);ctx.lineTo(0,-gw*.7);ctx.lineTo(gw/2,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    });
    ctx.restore();
  }

  _triangles(ctx,r,pal,ci,sym){
    const lw=this.params.lineWidth*this._sf,so=this.params.strokeOnly,fm=this.params.filledMode;
    for(let i=0;i<sym;i++){
      ctx.save();ctx.rotate((i/sym)*Math.PI*2);
      ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(-r*.3,-r*.4);ctx.lineTo(r*.3,-r*.4);ctx.closePath();
      ctx.strokeStyle=pal.colors[ci]+'66';ctx.lineWidth=lw;ctx.stroke();
      if(fm||!so){ctx.fillStyle=pal.colors[(ci+2)%pal.colors.length]+(fm?'44':'11');ctx.fill();}
      ctx.restore();
    }
  }

  _circleRing(ctx,r,pal,ci,petals){
    const lw=this.params.lineWidth*this._sf,so=this.params.strokeOnly,fm=this.params.filledMode;
    ctx.strokeStyle=pal.colors[ci]+'aa';ctx.lineWidth=lw*.8;
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    const pr=r*.15;
    for(let i=0;i<petals;i++){
      const a=(i/petals)*Math.PI*2;
      ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r);ctx.rotate(a+Math.PI/2);
      ctx.strokeStyle=pal.colors[ci]+'66';
      ctx.beginPath();ctx.ellipse(0,0,pr*.4,pr,0,0,Math.PI*2);
      if(fm||!so){ctx.fillStyle=pal.colors[(ci+i)%pal.colors.length]+(fm?'66':'33');ctx.fill();}
      ctx.stroke();ctx.restore();
    }
  }

  _lotus(ctx,r,pal,ci,petals){
    const lw=this.params.lineWidth*this._sf,so=this.params.strokeOnly,fm=this.params.filledMode;
    for(let layer=0;layer<2;layer++){
      const lr=r*(1-layer*.3),off=layer*(Math.PI/petals);
      for(let i=0;i<petals;i++){
        ctx.save();ctx.rotate((i/petals)*Math.PI*2+off);
        ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-lr*.25,-lr*.6,0,-lr);ctx.quadraticCurveTo(lr*.25,-lr*.6,0,0);
        if(so&&!fm){
          ctx.strokeStyle=pal.colors[(ci+layer)%pal.colors.length]+'66';ctx.lineWidth=lw*.5;ctx.stroke();
        }else{
          const g=ctx.createRadialGradient(0,-lr*.5,0,0,-lr*.5,lr*.4);
          g.addColorStop(0,pal.colors[(ci+layer)%pal.colors.length]+(fm?'88':'44'));g.addColorStop(1,'transparent');
          ctx.fillStyle=g;ctx.fill();
          ctx.strokeStyle=pal.colors[ci]+'44';ctx.lineWidth=lw*.5;ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  _diamonds(ctx,r,pal,ci,sym){
    const lw=this.params.lineWidth*this._sf,so=this.params.strokeOnly,fm=this.params.filledMode;
    for(let i=0;i<sym;i++){
      ctx.save();ctx.rotate((i/sym)*Math.PI*2);ctx.translate(0,-r);
      const d=r*.12;
      ctx.beginPath();ctx.moveTo(0,-d);ctx.lineTo(d*.6,0);ctx.lineTo(0,d);ctx.lineTo(-d*.6,0);ctx.closePath();
      ctx.strokeStyle=pal.colors[ci]+'55';ctx.lineWidth=lw*.7;
      if(fm||!so){ctx.fillStyle=pal.colors[(ci+3)%pal.colors.length]+(fm?'66':'33');ctx.fill();}
      ctx.stroke();ctx.restore();
    }
  }

  _stars(ctx,r,pal,ci,sym){
    const fm=this.params.filledMode;
    for(let i=0;i<sym;i++){
      ctx.save();ctx.rotate((i/sym)*Math.PI*2);ctx.translate(0,-r);
      const s=r*.08;
      ctx.fillStyle=pal.colors[(ci+4)%pal.colors.length]+(fm?'88':'55');
      ctx.beginPath();
      for(let j=0;j<5;j++){const a=(j/5)*Math.PI*2-Math.PI/2,a2=a+Math.PI/5;ctx.lineTo(Math.cos(a)*s,Math.sin(a)*s);ctx.lineTo(Math.cos(a2)*s*.4,Math.sin(a2)*s*.4);}
      ctx.closePath();ctx.fill();ctx.restore();
    }
  }

  _detailDots(ctx,r,pal,sym,li){
    const dr=r*(.9-li*.08),n=sym*(li+1),dot=Math.max(1,3-li)*this.params.lineWidth*this._sf;
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2;
      ctx.fillStyle=pal.colors[(li+i)%pal.colors.length]+'55';
      ctx.beginPath();ctx.arc(Math.cos(a)*dr,Math.sin(a)*dr,dot,0,Math.PI*2);ctx.fill();
    }
    if(li%2===0){
      ctx.strokeStyle=pal.colors[li%pal.colors.length]+'22';ctx.lineWidth=this.params.lineWidth*this._sf*.3;
      ctx.beginPath();ctx.arc(0,0,dr,0,Math.PI*2);ctx.stroke();
    }
  }

  _center(ctx,pal,r){
    const g=ctx.createRadialGradient(0,0,0,0,0,r*3);
    g.addColorStop(0,pal.colors[0]+'aa');g.addColorStop(.5,pal.colors[1]+'44');g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*3,0,Math.PI*2);ctx.fill();
    if(!this.params.strokeOnly||this.params.filledMode){ctx.fillStyle=pal.colors[0];ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle=pal.colors[0];ctx.lineWidth=this.params.lineWidth*this._sf;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=this.params.strokeOnly?pal.colors[0]:'#fff';ctx.beginPath();ctx.arc(0,0,r*.3,0,Math.PI*2);ctx.fill();
  }

  // ──── SACRED OBJECTS ────
  _sacredObjects(ctx,pal,r){
    const{type,count,size,ring,style,opacity}=this.params.objects;
    if(type==='none'||!SACRED_OBJECTS[type])return;
    const obj=SACRED_OBJECTS[type],os=r*(size/100),lw=this.params.lineWidth*this._sf;
    ctx.save();ctx.globalAlpha=opacity;
    if(style==='glow'){ctx.shadowColor=pal.colors[0];ctx.shadowBlur=os*.3;}
    if(count<=1&&ring===0){
      ctx.strokeStyle=pal.colors[0];ctx.fillStyle=pal.colors[0];
      if(style==='fill')ctx.fillStyle=pal.colors[0]+'44';
      obj.draw(ctx,os,lw);
    }else{
      const rr=ring===0?0:r*(ring/10);
      for(let i=0;i<count;i++){
        ctx.save();ctx.rotate((i/count)*Math.PI*2);ctx.translate(0,-rr);
        ctx.strokeStyle=pal.colors[i%pal.colors.length]+'cc';
        ctx.fillStyle=style==='fill'?pal.colors[i%pal.colors.length]+'44':pal.colors[i%pal.colors.length];
        obj.draw(ctx,os,lw);ctx.restore();
      }
    }
    ctx.restore();
  }

  // ──── MANTRA (at 0,0 center) ────
  _mantra(ctx,pal,r){
    let m=MANTRAS[this.params.mantra]; if(!m)return;
    if(this.params.mantra==='custom_mantra'&&this.params.customMantra)
      m={text:this.params.customMantra,chars:this.params.customMantra.split('')};
    if(!m.chars.length)return;
    ctx.save();ctx.globalAlpha=this.params.mantraOpacity;
    const ch=m.chars,fs=Math.max(10*this._sf,r*.04);
    ctx.font=`${fs}px 'JetBrains Mono',monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
    const enc=this.params.mantraEncoding;
    if(enc==='spiral'){
      const tc=ch.length*6;
      for(let i=0;i<tc;i++){const t=i/tc,sr=r*.15+r*.7*t,a=t*Math.PI*8;
        ctx.save();ctx.translate(Math.cos(a)*sr,Math.sin(a)*sr);ctx.rotate(a+Math.PI/2);
        ctx.fillStyle=pal.colors[i%pal.colors.length]+'aa';ctx.fillText(ch[i%ch.length],0,0);ctx.restore();}
    }else if(enc==='radial'){
      for(let ring=0;ring<4;ring++){const rr=r*(.3+ring*.18),cnt=ch.length*(ring+1);
        for(let i=0;i<cnt;i++){const a=(i/cnt)*Math.PI*2;
          ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.rotate(a+Math.PI/2);
          ctx.fillStyle=pal.colors[(i+ring)%pal.colors.length]+'88';ctx.fillText(ch[i%ch.length],0,0);ctx.restore();}}
    }else if(enc==='hidden'){
      ctx.globalAlpha=this.params.mantraOpacity*.3;ctx.font=`${Math.round(fs*.6)}px 'JetBrains Mono',monospace`;ctx.fillStyle=pal.colors[0]+'44';
      for(let i=0;i<36;i++){ctx.save();ctx.rotate((i/36)*Math.PI*2);ctx.fillText(m.text,0,-r*.5);ctx.restore();}
    }else if(enc==='glitch'){
      const tc=ch.length*8;
      for(let i=0;i<tc;i++){const a=this.seededRandom()*Math.PI*2,d=this.seededRandom()*r*.85,go=(this.seededRandom()-.5)*4*this._sf;
        ctx.save();ctx.translate(Math.cos(a)*d+go,Math.sin(a)*d);ctx.rotate(this.seededRandom()*Math.PI*2);
        ctx.fillStyle=pal.colors[i%pal.colors.length]+'77';ctx.fillText(ch[i%ch.length],0,0);ctx.restore();}
    }
    ctx.restore();
  }

  // ──── CUSTOM TEXT ────
  _customText(ctx,pal,r){
    const txt=this.params.customText;if(!txt)return;
    const fs=(this.params.customTextSize||12)*this._sf;
    const ringPos=this.params.customTextRing||5;
    const rr=r*(ringPos/10);
    ctx.save();ctx.globalAlpha=.7;
    ctx.font=`${fs}px 'JetBrains Mono',monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=pal.colors[0]+'cc';
    const chars=txt.split('');
    const circumference=2*Math.PI*rr;
    const charWidth=fs*.7;
    const totalChars=Math.max(chars.length, Math.floor(circumference/charWidth));
    for(let i=0;i<totalChars;i++){
      const a=(i/totalChars)*Math.PI*2;
      ctx.save();ctx.rotate(a);ctx.translate(0,-rr);
      ctx.fillStyle=pal.colors[i%pal.colors.length]+'aa';
      ctx.fillText(chars[i%chars.length],0,0);ctx.restore();
    }
    ctx.restore();
  }

  // ──── IMAGE MANDALA (at 0,0 center) ────
  _imageMandala(ctx,r){
    if(!this.uploadedImage)return;
    const{blend,opacity,fragments,rotation,kaleidoscope,mirror}=this.imageParams;
    const img=this._processedImage||this.uploadedImage;
    ctx.save();ctx.globalCompositeOperation=blend;ctx.globalAlpha=opacity;
    const fa=(Math.PI*2)/fragments,sz=r*1.8;
    for(let i=0;i<fragments;i++){
      ctx.save();ctx.rotate(fa*i+rotation*Math.PI/180);
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,0,fa);ctx.closePath();ctx.clip();
      const sc=sz/Math.max(img.width,img.height),w=img.width*sc,h=img.height*sc;
      if(kaleidoscope?i%2===1:mirror==='alternate'?i%2===1:mirror==='all') ctx.scale(-1,1);
      ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();
    }
    ctx.restore();
  }

  processImage(){
    if(!this.uploadedImage){this._processedImage=null;return;}
    const{threshold,edgeDetect}=this.imageParams;
    if(!threshold&&!edgeDetect){this._processedImage=null;return;}
    const img=this.uploadedImage,tc=document.createElement('canvas');tc.width=img.width;tc.height=img.height;
    const tctx=tc.getContext('2d');tctx.drawImage(img,0,0);
    const id=tctx.getImageData(0,0,tc.width,tc.height),d=id.data;
    if(threshold>0){const t=threshold*2.55;for(let i=0;i<d.length;i+=4){const v=(d[i]+d[i+1]+d[i+2])/3>t?255:0;d[i]=d[i+1]=d[i+2]=v;}}
    if(edgeDetect){const cp=new Uint8ClampedArray(d),w=tc.width;
      for(let y=1;y<tc.height-1;y++)for(let x=1;x<w-1;x++){const idx=(y*w+x)*4;
        for(let c=0;c<3;c++){const gx=-cp[((y-1)*w+x-1)*4+c]+cp[((y-1)*w+x+1)*4+c]-2*cp[(y*w+x-1)*4+c]+2*cp[(y*w+x+1)*4+c]-cp[((y+1)*w+x-1)*4+c]+cp[((y+1)*w+x+1)*4+c];
          const gy=-cp[((y-1)*w+x-1)*4+c]-2*cp[((y-1)*w+x)*4+c]-cp[((y-1)*w+x+1)*4+c]+cp[((y+1)*w+x-1)*4+c]+2*cp[((y+1)*w+x)*4+c]+cp[((y+1)*w+x+1)*4+c];
          d[idx+c]=Math.min(255,Math.sqrt(gx*gx+gy*gy));}}}
    tctx.putImageData(id,0,0);this._processedImage=tc;
  }

  setImage(img){this.uploadedImage=img;this._processedImage=null;}
  clearImage(){this.uploadedImage=null;this._processedImage=null;}

  // ──── ASCII RENDER ────
  toAscii(cols=100){
    const ctx=this.ctx,W=this.width,H=this.height;
    const aspect=.55;
    const rows=Math.round(cols*aspect);
    const cellW=W/cols,cellH=H/rows;
    const chars=' .·:;+*%#@█';
    const id=ctx.getImageData(0,0,W,H).data;
    let out='';
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        const px=Math.floor(x*cellW),py=Math.floor(y*cellH);
        const idx=(py*W+px)*4;
        const bright=(id[idx]*.299+id[idx+1]*.587+id[idx+2]*.114)/255;
        const ci=Math.floor(bright*(chars.length-1));
        out+=chars[ci];
      }
      out+='\n';
    }
    return out;
  }
}
