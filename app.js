document.addEventListener('DOMContentLoaded', () => {
  const mandalaCanvas = document.getElementById('mandalaCanvas');
  const glitchCanvas = document.getElementById('glitchCanvas');
  const asciiOverlay = document.getElementById('asciiOverlay');
  const engine = new MandalaEngine(mandalaCanvas);
  const glitch = new GlitchEngine(mandalaCanvas, glitchCanvas);

  let currentSeed = Math.random() * 99999;
  let isAnimating = false, animFrame = null, animTime = 0;
  let isFlyingInto = false, flyFrame = null, flyTime = 0;
  let asciiMode = false;
  let selectedExportRes = 2048;
  let selectedSvgRes = 2048;
  let currentExportFmt = 'png';
  const ASCII_COLS = 120;

  const counterEl = document.getElementById('counterValue');
  let lastLogTime = 0;

  fetch('/api/count').then(r=>r.json()).then(d=>{ counterEl.textContent = (d.count||0).toLocaleString(); }).catch(()=>{});

  function generate() {
    engine.generate(currentSeed);
    glitch.apply();
    if (asciiMode) updateAscii();
    const now = Date.now();
    if (now - lastLogTime > 800) {
      lastLogTime = now;
      fetch('/api/count',{method:'POST'}).then(r=>r.json()).then(d=>{ counterEl.textContent = (d.count||0).toLocaleString(); }).catch(()=>{});
    }
  }

  function updateAscii() {
    if (!asciiMode) { asciiOverlay.classList.add('hidden'); return; }
    asciiOverlay.textContent = engine.toAscii(ASCII_COLS);
    asciiOverlay.classList.remove('hidden');
    fitAsciiFont();
  }

  function fitAsciiFont() {
    const frame = document.getElementById('canvasFrame');
    const fw = frame.clientWidth, fh = frame.clientHeight;
    if (!fw || !fh) return;
    const rows = Math.round(ASCII_COLS * 0.55);
    const charW = fw / ASCII_COLS;
    const charH = fh / rows;
    const fontSize = Math.min(charW / 0.602, charH / 1.05);
    asciiOverlay.style.fontSize = fontSize.toFixed(2) + 'px';
  }

  function updateVal(id) {
    const el = document.getElementById(id), vEl = document.getElementById(id+'Val');
    if (!el || !vEl) return;
    let v = el.value;
    if (id==='hueRotate'||id==='innerRotation'||id==='imageRotation') v+='°';
    if (id==='lineWidth') v = (parseInt(el.value)/10).toFixed(1);
    vEl.textContent = v;
  }

  function setSlider(id, val) { const el=document.getElementById(id); if(el){el.value=val; updateVal(id);} }

  // ═══ TRADITIONS ═══
  document.querySelectorAll('.tradition-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tradition-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      engine.setTradition(btn.dataset.tradition);
      syncUI(); generate();
    });
  });

  function syncUI() {
    const p = engine.params;
    setSlider('rings',p.rings); setSlider('petals',p.petals);
    setSlider('symmetry',p.symmetry); setSlider('complexity',p.complexity);
    setSlider('lineWidth',Math.round(p.lineWidth*10));
    setSlider('innerRotation',p.innerRotation); setSlider('fractalDepth',p.fractalDepth);
    document.getElementById('strokeOnly').checked = p.strokeOnly;
    document.getElementById('filledMode').checked = p.filledMode;
    document.querySelectorAll('.shape-btn').forEach(b=>b.classList.toggle('active',p.shapes.has(b.dataset.shape)));
    const palBtn = document.querySelector(`.color-preset[data-palette="${p.palette}"]`);
    if (palBtn) { document.querySelectorAll('.color-preset').forEach(b=>b.classList.remove('active')); palBtn.classList.add('active'); }
  }

  // ═══ GEOMETRY ═══
  ['rings','petals','symmetry','complexity','scale'].forEach(id => {
    const el = document.getElementById(id); if(!el) return;
    el.addEventListener('input', ()=>{ updateVal(id); engine.setParam(id, parseInt(el.value)); generate(); });
  });

  document.getElementById('lineWidth').addEventListener('input', function(){ updateVal('lineWidth'); engine.setParam('lineWidth', parseInt(this.value)/10); generate(); });
  document.getElementById('innerRotation').addEventListener('input', function(){ updateVal('innerRotation'); engine.setParam('innerRotation', parseInt(this.value)); generate(); });
  document.getElementById('fractalDepth').addEventListener('input', function(){ updateVal('fractalDepth'); engine.setParam('fractalDepth', parseInt(this.value)); generate(); });
  document.getElementById('strokeOnly').addEventListener('change', function(){ engine.setParam('strokeOnly', this.checked); generate(); });
  document.getElementById('filledMode').addEventListener('change', function(){ engine.setParam('filledMode', this.checked); generate(); });

  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const s = btn.dataset.shape;
      engine.params.shapes.has(s) ? engine.params.shapes.delete(s) : engine.params.shapes.add(s);
      generate();
    });
  });

  // ═══ SACRED OBJECTS ═══
  document.getElementById('objectType').addEventListener('change', function(){ engine.params.objects.type = this.value; generate(); });
  document.getElementById('objectSize').addEventListener('input', function(){ updateVal('objectSize'); engine.params.objects.size = parseInt(this.value); generate(); });
  document.getElementById('objectCount').addEventListener('input', function(){ updateVal('objectCount'); engine.params.objects.count = parseInt(this.value); generate(); });
  document.getElementById('objectRing').addEventListener('input', function(){ updateVal('objectRing'); engine.params.objects.ring = parseInt(this.value); generate(); });
  document.getElementById('objectOpacity').addEventListener('input', function(){ updateVal('objectOpacity'); engine.params.objects.opacity = parseInt(this.value)/100; generate(); });
  document.getElementById('objectStyle').addEventListener('change', function(){ engine.params.objects.style = this.value; generate(); });

  // ═══ CUSTOM TEXT ═══
  document.getElementById('customTextInput').addEventListener('input', function(){ engine.setParam('customText', this.value); generate(); });
  document.getElementById('customTextSize').addEventListener('input', function(){ updateVal('customTextSize'); engine.setParam('customTextSize', parseInt(this.value)); generate(); });
  document.getElementById('customTextRing').addEventListener('input', function(){ updateVal('customTextRing'); engine.setParam('customTextRing', parseInt(this.value)); generate(); });

  // ═══ MANTRA ═══
  const mantraSelect = document.getElementById('mantraSelect'), customMantraInput = document.getElementById('customMantra');
  mantraSelect.addEventListener('change', () => {
    const v = mantraSelect.value;
    engine.setParam('mantra', v);
    customMantraInput.classList.toggle('hidden', v !== 'custom_mantra');
    const texts = { om_mani:'ॐ मणि पद्मे हूँ', gate_gate:'गते गते पारगते', om_tare:'ॐ तारे तुत्तारे',
      tayata:'तद्यथा ॐ बेकन्द्ज़े', nam_myoho:'南無妙法蓮華經', om_ah_hum:'ॐ आः हूँ वज्र गुरु' };
    document.getElementById('headerMantra').textContent = texts[v] || 'ॐ मणि पद्मे हूँ';
    generate();
  });
  customMantraInput.addEventListener('input', ()=>{ engine.setParam('customMantra', customMantraInput.value); generate(); });
  document.getElementById('mantraEncoding').addEventListener('change', function(){ engine.setParam('mantraEncoding', this.value); generate(); });
  document.getElementById('mantraOpacity').addEventListener('input', function(){ updateVal('mantraOpacity'); engine.setParam('mantraOpacity', parseInt(this.value)/100); generate(); });

  // ═══ GLITCH ═══
  const glitchIds = ['rgbShift','noise','scanlines','distortion','pixelate','flicker'];
  glitchIds.forEach(id => {
    const el = document.getElementById(id); if(!el) return;
    el.addEventListener('input', ()=>{ updateVal(id); glitch.setParam(id, parseFloat(el.value)); glitch.apply(); });
  });
  document.getElementById('btnGlitchPreset').addEventListener('click', ()=>{
    glitch.glitchBurst(); setTimeout(()=>glitch.glitchBurst(),300); setTimeout(()=>glitch.glitchBurst(),700);
  });

  // ═══ COLOR CORRECTION ═══
  ['hueRotate','saturation','brightness','contrast','invert'].forEach(id => {
    const el = document.getElementById(id); if(!el) return;
    el.addEventListener('input', ()=>{ updateVal(id); glitch.setColorCorrection(id, parseFloat(el.value)); generate(); });
  });

  document.querySelectorAll('.color-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-preset').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); engine.setParam('palette', btn.dataset.palette); generate();
    });
  });

  // ═══ CUSTOM GRADIENT ═══
  document.getElementById('gradientEnabled').addEventListener('change', function(){
    engine.params.customGradient.enabled = this.checked; generate();
  });
  ['gradColor1','gradColor2','gradColor3'].forEach((id, i) => {
    document.getElementById(id).addEventListener('input', function(){
      engine.params.customGradient['color'+(i+1)] = this.value; if(engine.params.customGradient.enabled) generate();
    });
  });
  document.getElementById('gradBgType').addEventListener('change', function(){
    engine.params.customGradient.bgType = this.value; if(engine.params.customGradient.enabled) generate();
  });
  document.getElementById('gradBgColor').addEventListener('input', function(){
    engine.params.customGradient.bg = this.value; if(engine.params.customGradient.enabled) generate();
  });

  // ═══ IMAGE ═══
  const uploadArea = document.getElementById('uploadArea'), imageUpload = document.getElementById('imageUpload');
  const imageControls = document.getElementById('imageControls');
  uploadArea.addEventListener('click', ()=>imageUpload.click());
  uploadArea.addEventListener('dragover', e=>{ e.preventDefault(); uploadArea.style.borderColor='var(--accent)'; });
  uploadArea.addEventListener('dragleave', ()=>{ uploadArea.style.borderColor=''; });
  uploadArea.addEventListener('drop', e=>{ e.preventDefault(); uploadArea.style.borderColor='';
    const f=e.dataTransfer.files[0]; if(f&&f.type.startsWith('image/')) loadImg(f);
  });
  imageUpload.addEventListener('change', ()=>{ if(imageUpload.files[0]) loadImg(imageUpload.files[0]); });

  function loadImg(file) {
    const r = new FileReader();
    r.onload = e => { const img = new Image(); img.onload = ()=>{ engine.setImage(img); uploadArea.classList.add('has-image');
      uploadArea.querySelector('.upload-text').textContent=file.name; imageControls.classList.remove('hidden'); generate(); };
      img.src = e.target.result; };
    r.readAsDataURL(file);
  }

  document.getElementById('btnClearImage').addEventListener('click', ()=>{
    engine.clearImage(); uploadArea.classList.remove('has-image');
    uploadArea.querySelector('.upload-text').textContent='Drop image or click';
    imageControls.classList.add('hidden'); imageUpload.value=''; generate();
  });

  document.getElementById('imageBlend').addEventListener('change', function(){ engine.imageParams.blend=this.value; generate(); });
  document.getElementById('imageOpacity').addEventListener('input', function(){ updateVal('imageOpacity'); engine.imageParams.opacity=parseInt(this.value)/100; generate(); });
  document.getElementById('imageFragments').addEventListener('input', function(){ updateVal('imageFragments'); engine.imageParams.fragments=parseInt(this.value); generate(); });
  document.getElementById('imageRotation').addEventListener('input', function(){ updateVal('imageRotation'); engine.imageParams.rotation=parseInt(this.value); generate(); });
  document.getElementById('imageThreshold').addEventListener('input', function(){ updateVal('imageThreshold'); engine.imageParams.threshold=parseInt(this.value); engine.processImage(); generate(); });
  document.getElementById('imageMirror').addEventListener('change', function(){ engine.imageParams.mirror=this.value; generate(); });
  document.getElementById('imageKaleidoscope').addEventListener('change', function(){ engine.imageParams.kaleidoscope=this.checked; generate(); });
  document.getElementById('imageEdgeDetect').addEventListener('change', function(){ engine.imageParams.edgeDetect=this.checked; engine.processImage(); generate(); });

  // ═══ ANIMATE / PLAY (merged) ═══
  const animModeSelect = document.getElementById('animMode');
  const btnAnimate = document.getElementById('btnAnimate');
  let autoPlayInterval = null;

  btnAnimate.addEventListener('click', () => {
    if (isFlyingInto) { stopFlyInto(); document.getElementById('btnFlyInto').classList.remove('active'); document.getElementById('btnFlyInto').innerHTML='⊛ FLY INTO'; }
    if (isAnimating || autoPlayInterval) {
      stopAll();
    } else {
      const mode = animModeSelect.value;
      if (mode === 'rotate') startAnim();
      else startAutoPlay();
    }
  });

  function stopAll() {
    if (isAnimating) stopAnim();
    if (autoPlayInterval) stopAutoPlay();
    btnAnimate.classList.remove('active');
    btnAnimate.innerHTML = '◎ START';
    btnAnimate.style.borderColor = '';
    btnAnimate.style.color = '';
  }

  function startAnim() {
    isAnimating=true; animTime=0;
    btnAnimate.classList.add('active');
    btnAnimate.innerHTML='◎ STOP';
    animLoop();
  }

  function stopAnim() {
    isAnimating=false;
    if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
    engine.setParam('rotation',0);
    generate();
  }

  function animLoop() {
    if(!isAnimating) return;
    animTime++; engine.setParam('rotation', animTime*0.3);
    engine.generate(currentSeed); glitch.time=animTime; glitch.apply();
    if(asciiMode) updateAscii();
    animFrame = requestAnimationFrame(animLoop);
  }

  function startAutoPlay() {
    btnAnimate.classList.add('active');
    btnAnimate.innerHTML = '◎ STOP';
    triggerRandom();
    autoPlayInterval = setInterval(triggerRandom, 250);
  }

  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
  }

  function triggerRandom() {
    document.getElementById('btnRandom').click();
  }

  // ═══ FLY-INTO — smooth procedural tunnel ═══
  document.getElementById('btnFlyInto').addEventListener('click', ()=>{
    if (isAnimating || autoPlayInterval) { stopAll(); }
    const btn = document.getElementById('btnFlyInto');
    if (isFlyingInto) { stopFlyInto(); btn.classList.remove('active'); btn.innerHTML='⊛ FLY INTO'; }
    else { startFlyInto(); btn.classList.add('active'); btn.innerHTML='⊛ STOP'; }
  });

  const FLY_LAYER_COUNT = 6;
  let flyLayers = [];

  function createFlyLayer(scale, seedOffset) {
    const c = document.createElement('canvas');
    c.width = 800; c.height = 800;
    const s = currentSeed + (seedOffset || 0) * 111;
    engine.renderToCanvas(c, s);
    return { canvas: c, scale, seed: s, baseRotation: Math.random() * 360, age: 0 };
  }

  function startFlyInto() {
    isFlyingInto = true; flyTime = 0; flyLayers = [];
    for (let i = 0; i < FLY_LAYER_COUNT; i++) {
      flyLayers.push(createFlyLayer(0.1 + i * 0.5, i));
    }
    flyLoop();
  }

  function stopFlyInto() {
    isFlyingInto = false;
    if (flyFrame) { cancelAnimationFrame(flyFrame); flyFrame = null; }
    flyLayers = [];
    engine.setParam('rotation', 0);
    generate();
  }

  function flyLoop() {
    if (!isFlyingInto) return;
    flyTime++;
    const ctx = mandalaCanvas.getContext('2d');
    const pal = engine.getPalette();
    const W = 800, H = 800, cx = W/2, cy = H/2;

    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);

    flyLayers.sort((a, b) => a.scale - b.scale);

    for (const layer of flyLayers) {
      const speed = 0.003 + layer.scale * 0.001;
      layer.scale += speed;
      layer.age++;

      const fadeIn = Math.min(1, layer.age / 60);
      const fadeOut = layer.scale > 2.5 ? Math.max(0, (4 - layer.scale) / 1.5) : 1;
      const alpha = fadeIn * fadeOut;
      if (alpha <= 0) continue;

      const rot = (layer.baseRotation + flyTime * 0.05) * Math.PI / 180;
      const ease = 1 - Math.pow(1 - Math.min(layer.scale, 1), 3);

      ctx.save();
      ctx.globalAlpha = alpha * (0.5 + ease * 0.5);
      ctx.translate(cx, cy);
      ctx.rotate(rot * 0.3);
      ctx.scale(layer.scale, layer.scale);
      ctx.translate(-cx, -cy);
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    }

    flyLayers = flyLayers.filter(l => l.scale < 4);
    while (flyLayers.length < FLY_LAYER_COUNT) {
      flyLayers.push(createFlyLayer(0.02, Math.floor(Math.random() * 100)));
    }

    glitch.apply();
    if (asciiMode) updateAscii();
    flyFrame = requestAnimationFrame(flyLoop);
  }

  // ═══ ASCII MODE ═══
  const btnAscii = document.getElementById('btnAscii');
  btnAscii.addEventListener('click', ()=>{
    asciiMode = !asciiMode;
    btnAscii.classList.toggle('active', asciiMode);
    btnAscii.innerHTML = asciiMode ? '▣ ASCII OFF' : '▣ ASCII';
    if (asciiMode) updateAscii(); else asciiOverlay.classList.add('hidden');
  });
  window.addEventListener('resize', ()=>{ if(asciiMode) fitAsciiFont(); });

  // ═══ FULLSCREEN ═══
  document.getElementById('btnFullscreen').addEventListener('click', ()=>{
    const frame = document.getElementById('canvasFrame');
    if (!document.fullscreenElement) frame.requestFullscreen().catch(()=>{});
    else document.exitFullscreen();
  });

  // ═══ RANDOM ═══
  document.getElementById('btnRandom').addEventListener('click', ()=>{
    currentSeed = Math.random()*99999;
    engine.setParam('rings', 2+Math.floor(Math.random()*10));
    engine.setParam('petals', 3+Math.floor(Math.random()*29));
    engine.setParam('symmetry', 1+Math.floor(Math.random()*23));
    engine.setParam('complexity', 1+Math.floor(Math.random()*10));
    engine.setParam('scale', 40+Math.floor(Math.random()*60));
    engine.setParam('lineWidth', 0.3+Math.random()*3);
    engine.setParam('innerRotation', Math.floor(Math.random()*45));
    engine.setParam('fractalDepth', Math.random()>0.6 ? Math.floor(Math.random()*6) : 0);
    engine.setParam('strokeOnly', Math.random()>0.7);
    engine.setParam('filledMode', Math.random()>0.5);

    const all=['circle','square','triangle','lotus','diamond','star'], shapes=new Set();
    shapes.add(all[Math.floor(Math.random()*all.length)]);
    all.forEach(s=>{ if(Math.random()>0.5) shapes.add(s); });
    engine.params.shapes = shapes;

    const pals = Object.keys(PALETTES);
    engine.setParam('palette', pals[Math.floor(Math.random()*pals.length)]);

    const objs = Object.keys(SACRED_OBJECTS).filter(k=>k!=='none');
    if (Math.random()>0.5) {
      engine.params.objects.type = objs[Math.floor(Math.random()*objs.length)];
      engine.params.objects.count = 1+Math.floor(Math.random()*8);
      engine.params.objects.size = 10+Math.floor(Math.random()*50);
      engine.params.objects.ring = Math.floor(Math.random()*8);
      engine.params.objects.style = ['stroke','fill','glow'][Math.floor(Math.random()*3)];
    } else { engine.params.objects.type = 'none'; }

    glitch.setParam('rgbShift', Math.floor(Math.random()*15));
    glitch.setParam('noise', Math.floor(Math.random()*40));
    glitch.setParam('scanlines', Math.floor(Math.random()*60));
    glitch.setParam('distortion', Math.floor(Math.random()*20));

    syncUI(); syncGlitchUI(); syncObjectsUI(); generate();
  });

  function syncGlitchUI() { glitchIds.forEach(id=>{ const el=document.getElementById(id); if(el){el.value=glitch.params[id];updateVal(id);} }); }
  function syncObjectsUI() {
    const o = engine.params.objects;
    document.getElementById('objectType').value = o.type;
    setSlider('objectSize', o.size); setSlider('objectCount', o.count);
    setSlider('objectRing', o.ring); setSlider('objectOpacity', Math.round(o.opacity*100));
    document.getElementById('objectStyle').value = o.style;
  }

  // ═══ EXPORT MODAL (PNG / GIF / JSON) ═══
  document.getElementById('btnExport').addEventListener('click', ()=>document.getElementById('exportModal').classList.remove('hidden'));
  document.getElementById('btnExportCancel').addEventListener('click', ()=>document.getElementById('exportModal').classList.add('hidden'));

  document.querySelectorAll('.export-fmt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.export-fmt-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentExportFmt = btn.dataset.fmt;
      document.getElementById('exportPngOpts').classList.toggle('hidden', currentExportFmt !== 'png');
      document.getElementById('exportSvgOpts').classList.toggle('hidden', currentExportFmt !== 'svg');
      document.getElementById('exportGifOpts').classList.toggle('hidden', currentExportFmt !== 'gif');
      document.getElementById('exportJsonOpts').classList.toggle('hidden', currentExportFmt !== 'json');
      const dlBtn = document.getElementById('btnExportConfirm');
      if (currentExportFmt === 'png') dlBtn.innerHTML = '⬡ DOWNLOAD';
      else if (currentExportFmt === 'svg') dlBtn.innerHTML = '⬡ DOWNLOAD SVG';
      else if (currentExportFmt === 'gif') dlBtn.innerHTML = '⟐ RENDER';
      else dlBtn.innerHTML = '⬡ EXPORT JSON';
    });
  });

  document.querySelectorAll('.export-res-btn:not(.svg-res-btn)').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.export-res-btn:not(.svg-res-btn)').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); selectedExportRes=parseInt(btn.dataset.w);
    });
  });
  document.querySelectorAll('.svg-res-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.svg-res-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); selectedSvgRes=parseInt(btn.dataset.w);
    });
  });

  document.getElementById('gifSpeed').addEventListener('input', function(){ updateVal('gifSpeed'); });

  document.getElementById('btnExportConfirm').addEventListener('click', () => {
    if (currentExportFmt === 'png') exportHiRes(selectedExportRes);
    else if (currentExportFmt === 'svg') exportSVG(selectedSvgRes);
    else if (currentExportFmt === 'gif') exportGifFromModal();
    else exportJSON();
  });

  function exportHiRes(size) {
    const prog=document.getElementById('exportProgress'), fill=document.getElementById('exportProgressFill'), txt=document.getElementById('exportProgressText');
    prog.classList.remove('hidden'); fill.style.width='10%'; txt.textContent=`Rendering ${size}×${size}...`;
    requestAnimationFrame(()=>{
      const ec=document.createElement('canvas'); ec.width=size; ec.height=size;
      engine.renderToCanvas(ec, currentSeed);
      fill.style.width='60%';
      if (glitch.hasActiveEffects()) {
        const gc=document.createElement('canvas'); gc.width=size; gc.height=size;
        glitch.applyToCanvas(gc.getContext('2d'), ec, size, size);
        ec.getContext('2d').drawImage(gc,0,0);
      }
      fill.style.width='90%'; txt.textContent='Encoding...';
      requestAnimationFrame(()=>{
        const link=document.createElement('a'); link.download=`meta-mandala-${size}px-${Date.now()}.png`;
        link.href=ec.toDataURL('image/png'); link.click();
        fill.style.width='100%'; txt.textContent='Done!';
        setTimeout(()=>{ prog.classList.add('hidden'); document.getElementById('exportModal').classList.add('hidden'); }, 600);
      });
    });
  }

  function exportSVG(size) {
    const prog=document.getElementById('exportProgress'), fill=document.getElementById('exportProgressFill'), txt=document.getElementById('exportProgressText');
    prog.classList.remove('hidden'); fill.style.width='20%'; txt.textContent=`Rendering SVG ${size}×${size}...`;
    requestAnimationFrame(()=>{
      try {
        const svgCtx = new C2S(size, size);
        const mockCanvas = { width:size, height:size, getContext:()=>svgCtx };
        engine.renderToCanvas(mockCanvas, currentSeed);
        fill.style.width='80%'; txt.textContent='Encoding SVG...';
        requestAnimationFrame(()=>{
          const svgStr = svgCtx.toSVG();
          const blob = new Blob([svgStr], {type:'image/svg+xml'});
          const link = document.createElement('a');
          link.download = `meta-mandala-${size}px-${Date.now()}.svg`;
          link.href = URL.createObjectURL(blob); link.click();
          fill.style.width='100%'; txt.textContent='Done!';
          setTimeout(()=>{ prog.classList.add('hidden'); document.getElementById('exportModal').classList.add('hidden'); },600);
        });
      } catch(err) {
        console.error('SVG export error:', err);
        fill.style.width='100%'; txt.textContent='Error: '+err.message;
        setTimeout(()=>prog.classList.add('hidden'), 3000);
      }
    });
  }

  function exportGifFromModal() {
    const fmt=document.getElementById('gifFormat').value, res=parseInt(document.getElementById('gifResolution').value);
    const dur=parseInt(document.getElementById('gifDuration').value), fps=parseInt(document.getElementById('gifFps').value);
    const spd=parseInt(document.getElementById('gifSpeed').value);
    if(fmt==='webm') exportWebM(res,dur,fps,spd); else exportGIF(res,dur,fps,spd);
  }

  function exportGIF(size,duration,fps,speed) {
    const prog=document.getElementById('exportProgress'), fill=document.getElementById('exportProgressFill'), txt=document.getElementById('exportProgressText');
    prog.classList.remove('hidden');
    const total=fps*duration, enc=new GIFEncoder(size,size); enc.setDelay(1000/fps);
    const fc=document.createElement('canvas'); fc.width=size; fc.height=size;
    let frame=0;
    function next() {
      if (frame>=total) {
        txt.textContent='Encoding GIF...'; fill.style.width='95%';
        requestAnimationFrame(()=>{
          const blob=enc.render(), link=document.createElement('a');
          link.download=`meta-mandala-${Date.now()}.gif`; link.href=URL.createObjectURL(blob); link.click();
          fill.style.width='100%'; txt.textContent='Done!';
          setTimeout(()=>{ prog.classList.add('hidden'); document.getElementById('exportModal').classList.add('hidden'); },600);
          engine.setParam('rotation',0); generate();
        }); return;
      }
      engine.setParam('rotation',(frame/total)*360*speed);
      engine.renderToCanvas(fc, currentSeed);
      if (glitch.hasActiveEffects()) {
        const gc=document.createElement('canvas'); gc.width=size; gc.height=size;
        glitch.time=frame*2; glitch.applyToCanvas(gc.getContext('2d'),fc,size,size);
        fc.getContext('2d').drawImage(gc,0,0);
      }
      enc.addFrame(fc); frame++;
      fill.style.width=Math.round(frame/total*90)+'%'; txt.textContent=`Frame ${frame}/${total}`;
      requestAnimationFrame(next);
    }
    next();
  }

  async function exportWebM(size,duration,fps,speed) {
    const prog=document.getElementById('exportProgress'), fill=document.getElementById('exportProgressFill'), txt=document.getElementById('exportProgressText');
    prog.classList.remove('hidden');
    const fc=document.createElement('canvas'); fc.width=size; fc.height=size;
    const exp=new VideoExporter(fc,{fps,duration});
    const blob = await exp.exportWebM((frame,total)=>{
      engine.setParam('rotation',(frame/total)*360*speed);
      engine.renderToCanvas(fc, currentSeed);
      if (glitch.hasActiveEffects()) {
        const gc=document.createElement('canvas'); gc.width=size; gc.height=size;
        glitch.time=frame*2; glitch.applyToCanvas(gc.getContext('2d'),fc,size,size);
        fc.getContext('2d').drawImage(gc,0,0);
      }
    }, pct=>{ fill.style.width=Math.round(pct*95)+'%'; txt.textContent=`Recording ${Math.round(pct*100)}%`; });
    const link=document.createElement('a'); link.download=`meta-mandala-${Date.now()}.webm`;
    link.href=URL.createObjectURL(blob); link.click();
    fill.style.width='100%'; txt.textContent='Done!';
    setTimeout(()=>{ prog.classList.add('hidden'); document.getElementById('exportModal').classList.add('hidden'); },600);
    engine.setParam('rotation',0); generate();
  }

  // ═══ JSON EXPORT / IMPORT ═══
  function buildMandalaJSON() {
    const p = engine.params;
    return {
      version: '0.1.0',
      seed: currentSeed,
      params: {
        rings: p.rings, petals: p.petals, symmetry: p.symmetry,
        complexity: p.complexity, scale: p.scale, lineWidth: p.lineWidth,
        innerRotation: p.innerRotation, fractalDepth: p.fractalDepth,
        strokeOnly: p.strokeOnly, filledMode: p.filledMode,
        shapes: Array.from(p.shapes),
        palette: p.palette, tradition: p.tradition,
        mantra: p.mantra, mantraEncoding: p.mantraEncoding,
        mantraOpacity: p.mantraOpacity, customMantra: p.customMantra || '',
        customText: p.customText || '',
        customTextSize: p.customTextSize || 12,
        customTextRing: p.customTextRing || 5,
        objects: { ...p.objects },
        customGradient: { ...p.customGradient }
      },
      glitch: { ...glitch.params },
      colorCorrection: { ...glitch.colorCorrection }
    };
  }

  function exportJSON() {
    const data = buildMandalaJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `meta-mandala-${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    document.getElementById('exportModal').classList.add('hidden');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        applyMandalaJSON(data);
      } catch(err) { console.error('Invalid JSON:', err); }
    };
    reader.readAsText(file);
  }

  function applyMandalaJSON(data) {
    if (data.seed != null) currentSeed = data.seed;
    const p = data.params;
    if (p) {
      if (p.tradition) {
        engine.setTradition(p.tradition);
        document.querySelectorAll('.tradition-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.tradition === p.tradition);
        });
      }
      ['rings','petals','symmetry','complexity','scale','lineWidth',
       'innerRotation','fractalDepth','strokeOnly','filledMode',
       'mantra','mantraEncoding','mantraOpacity','customMantra',
       'customText','customTextSize','customTextRing','palette'].forEach(k => {
        if (p[k] != null) engine.setParam(k, p[k]);
      });
      if (p.shapes) engine.params.shapes = new Set(p.shapes);
      if (p.objects) Object.assign(engine.params.objects, p.objects);
      if (p.customGradient) Object.assign(engine.params.customGradient, p.customGradient);
    }
    if (data.glitch) {
      Object.keys(data.glitch).forEach(k => glitch.setParam(k, data.glitch[k]));
    }
    if (data.colorCorrection) {
      Object.keys(data.colorCorrection).forEach(k => glitch.setColorCorrection(k, data.colorCorrection[k]));
    }
    syncUI(); syncGlitchUI(); syncObjectsUI(); syncImportUI(data);
    generate();
  }

  function syncImportUI(data) {
    const p = data.params || {};
    if (p.customText) document.getElementById('customTextInput').value = p.customText;
    if (p.mantra) {
      document.getElementById('mantraSelect').value = p.mantra;
      document.getElementById('customMantra').classList.toggle('hidden', p.mantra !== 'custom_mantra');
      if (p.customMantra) document.getElementById('customMantra').value = p.customMantra;
    }
    setSlider('scale', p.scale || 80);
    setSlider('customTextSize', p.customTextSize || 12);
    setSlider('customTextRing', p.customTextRing || 5);
    setSlider('mantraOpacity', Math.round((p.mantraOpacity || 0.4) * 100));
    if (p.mantraEncoding) document.getElementById('mantraEncoding').value = p.mantraEncoding;
    if (p.customGradient) {
      document.getElementById('gradientEnabled').checked = !!p.customGradient.enabled;
      if (p.customGradient.color1) document.getElementById('gradColor1').value = p.customGradient.color1;
      if (p.customGradient.color2) document.getElementById('gradColor2').value = p.customGradient.color2;
      if (p.customGradient.color3) document.getElementById('gradColor3').value = p.customGradient.color3;
      if (p.customGradient.bgType) document.getElementById('gradBgType').value = p.customGradient.bgType;
      if (p.customGradient.bg) document.getElementById('gradBgColor').value = p.customGradient.bg;
    }
    const cc = data.colorCorrection || {};
    ['hueRotate','saturation','brightness','contrast','invert'].forEach(k => {
      if (cc[k] != null) setSlider(k, cc[k]);
    });
  }

  // ═══ IMPORT BUTTON ═══
  document.getElementById('btnImport').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', function() {
    if (this.files[0]) { importJSON(this.files[0]); this.value = ''; }
  });

  // ═══ RECORD (capture canvas as WebM video) ═══
  let mediaRecorder = null, recordedChunks = [];
  const btnRecord = document.getElementById('btnRecord');
  btnRecord.addEventListener('click', ()=>{
    if (mediaRecorder && mediaRecorder.state === 'recording') { stopRecording(); }
    else { startRecording(); }
  });

  function startRecording() {
    const combined = document.createElement('canvas');
    combined.width = 800; combined.height = 800;
    const cCtx = combined.getContext('2d');
    const cStream = combined.captureStream(30);

    function drawCombined() {
      cCtx.drawImage(mandalaCanvas, 0, 0);
      cCtx.drawImage(glitchCanvas, 0, 0);
      if (mediaRecorder && mediaRecorder.state === 'recording')
        requestAnimationFrame(drawCombined);
    }

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(cStream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000
    });
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const link = document.createElement('a');
      link.download = `meta-mandala-${Date.now()}.webm`;
      link.href = URL.createObjectURL(blob);
      link.click();
    };

    mediaRecorder.start();
    drawCombined();
    btnRecord.classList.add('active');
    btnRecord.innerHTML = '⏺ STOP';
    btnRecord.style.borderColor = '#eb4d4b';
    btnRecord.style.color = '#eb4d4b';
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
    btnRecord.classList.remove('active');
    btnRecord.innerHTML = '⏺ REC';
    btnRecord.style.borderColor = '';
    btnRecord.style.color = '';
  }

  // ═══ ABOUT PANEL ═══
  const aboutToggle = document.getElementById('aboutToggle');
  const aboutPanel = document.getElementById('aboutPanel');
  const aboutClose = document.getElementById('aboutClose');
  aboutToggle.addEventListener('click', () => aboutPanel.classList.toggle('hidden'));
  aboutClose.addEventListener('click', () => aboutPanel.classList.add('hidden'));
  document.addEventListener('click', e => {
    if (!aboutPanel.classList.contains('hidden') && !aboutPanel.contains(e.target) && e.target !== aboutToggle)
      aboutPanel.classList.add('hidden');
  });

  // ═══ KEYBOARD ═══
  document.addEventListener('keydown', e=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA') return;
    switch(e.key.toLowerCase()){
      case 'g': currentSeed=Math.random()*99999; generate(); break;
      case 'r': document.getElementById('btnRandom').click(); break;
      case 'e': document.getElementById('btnExport').click(); break;
      case 'f': document.getElementById('btnFullscreen').click(); break;
      case 'a': document.getElementById('btnAscii').click(); break;
      case ' ': e.preventDefault(); btnAnimate.click(); break;
      case 'escape':
        document.getElementById('exportModal').classList.add('hidden'); break;
    }
  });

  // ═══ INIT ═══
  generate();
  console.log('%c☸ META MANDALA initialized\n◈ dharma protocols active\n✦ seed: '+Math.floor(currentSeed),
    'color:#9b59b6;font-family:monospace');
});
