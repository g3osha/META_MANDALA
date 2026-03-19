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
  const tooltip = document.getElementById('traditionTooltip');
  const tooltipText = document.getElementById('tooltipText');
  const tooltipLink = document.getElementById('tooltipLink');

  document.querySelectorAll('.tradition-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tradition-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      engine.params.customGradient.enabled = false;
      const gradCb = document.getElementById('gradientEnabled');
      if (gradCb) gradCb.checked = false;
      engine.setTradition(btn.dataset.tradition);
      currentSeed = Math.random() * 99999;
      syncUI(); generate();
      showTraditionTooltip(btn);
    });
    btn.addEventListener('mouseenter', () => showTraditionTooltip(btn));
    btn.removeAttribute('title');
  });

  function showTraditionTooltip(btn) {
    const info = btn.dataset.info;
    const link = btn.dataset.link;
    if (!info) { tooltip.classList.add('hidden'); return; }
    tooltipText.textContent = info;
    if (link) { tooltipLink.href = link; tooltipLink.classList.remove('hidden'); }
    else { tooltipLink.classList.add('hidden'); }
    tooltip.classList.remove('hidden');
  }

  function syncUI() {
    const p = engine.params;
    setSlider('rings',p.rings); setSlider('petals',p.petals);
    setSlider('symmetry',p.symmetry); setSlider('complexity',p.complexity);
    setSlider('scale',p.scale);
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
      tayata:'तद्यथा ॐ बेकन्द्ज़े', nam_myoho:'南無妙法蓮華經', om_ah_hum:'ॐ आः हूँ वज्र गुरु',
      slavic_runes:'ᚠᚢᚦᚨᚱᚲ', slavic_prayer:'Слава Роду', glagolitic:'ⰀⰁⰂⰃⰄⰅ' };
    const hm = document.getElementById('headerMantra');
    if (hm) hm.textContent = texts[v] || 'ॐ मणि पद्मे हूँ';
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

  // ═══ COLOR CORRECTION (via CSS filter for guaranteed visual) ═══
  const canvasFrame = document.getElementById('canvasFrame');
  function updateColorFilter() {
    const cc = glitch.colorCorrection;
    const parts = [];
    if (cc.hueRotate !== 0) parts.push(`hue-rotate(${cc.hueRotate}deg)`);
    if (cc.saturation !== 100) parts.push(`saturate(${cc.saturation}%)`);
    if (cc.brightness !== 100) parts.push(`brightness(${cc.brightness}%)`);
    if (cc.contrast !== 100) parts.push(`contrast(${cc.contrast}%)`);
    if (cc.invert !== 0) parts.push(`invert(${cc.invert}%)`);
    canvasFrame.style.filter = parts.length ? parts.join(' ') : '';
  }
  ['hueRotate','saturation','brightness','contrast','invert'].forEach(id => {
    const el = document.getElementById(id); if(!el) return;
    el.addEventListener('input', ()=>{
      updateVal(id);
      glitch.setColorCorrection(id, parseFloat(el.value));
      updateColorFilter();
    });
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
  const animSpeedSlider = document.getElementById('animSpeed');
  let autoPlayInterval = null;
  let currentAnimMode = 'rotate';
  let animBaseParams = {};
  let animSpeedMul = 5;

  animSpeedSlider.addEventListener('input', function(){ updateVal('animSpeed'); animSpeedMul = parseInt(this.value); });

  btnAnimate.addEventListener('click', () => {
    if (isFlyingInto) { stopFlyInto(); document.getElementById('btnFlyInto').classList.remove('active'); document.getElementById('btnFlyInto').innerHTML='⊛ FLY INTO'; }
    if (isAnimating || autoPlayInterval) {
      stopAll();
    } else {
      currentAnimMode = animModeSelect.value;
      if (currentAnimMode === 'play') startAutoPlay();
      else startAnim();
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
    animBaseParams = {
      scale: engine.params.scale,
      innerRotation: engine.params.innerRotation,
      rings: engine.params.rings,
      petals: engine.params.petals,
      symmetry: engine.params.symmetry,
      complexity: engine.params.complexity,
      lineWidth: engine.params.lineWidth
    };
    btnAnimate.classList.add('active');
    btnAnimate.innerHTML='◎ STOP';
    animLoop();
  }

  function stopAnim() {
    isAnimating=false;
    if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
    engine.setParam('rotation',0);
    if (animBaseParams.scale) {
      engine.setParam('scale', animBaseParams.scale);
      engine.setParam('innerRotation', animBaseParams.innerRotation);
      engine.setParam('rings', animBaseParams.rings);
      engine.setParam('petals', animBaseParams.petals);
      engine.setParam('symmetry', animBaseParams.symmetry);
      engine.setParam('complexity', animBaseParams.complexity);
      engine.setParam('lineWidth', animBaseParams.lineWidth);
    }
    syncUI(); generate();
  }

  function applyAnimFrame(mode, t, speed, base) {
    const s = speed / 5;
    if (mode === 'rotate') {
      engine.setParam('rotation', animTime * 0.3 * s);
    } else if (mode === 'pulse') {
      engine.setParam('scale', base.scale + Math.sin(t * 2 * s) * 20);
      engine.setParam('rotation', animTime * 0.1 * s);
    } else if (mode === 'breathe') {
      engine.setParam('innerRotation', base.innerRotation + Math.sin(t * 0.8 * s) * 30);
      engine.setParam('scale', base.scale + Math.sin(t * 0.5 * s) * 8);
      engine.setParam('lineWidth', base.lineWidth + Math.sin(t * 1.2 * s) * 0.5);
    } else if (mode === 'morph') {
      const ms = 0.3 * s;
      engine.setParam('rings', Math.max(1, Math.round(base.rings + Math.sin(t * ms) * 3)));
      engine.setParam('petals', Math.max(1, Math.round(base.petals + Math.sin(t * ms * 0.7) * 6)));
      engine.setParam('symmetry', Math.max(1, Math.round(base.symmetry + Math.sin(t * ms * 0.5) * 4)));
      engine.setParam('complexity', Math.max(1, Math.round(base.complexity + Math.sin(t * ms * 0.3) * 3)));
      engine.setParam('lineWidth', Math.max(0.3, base.lineWidth + Math.sin(t * ms * 0.4) * 1));
      engine.setParam('rotation', animTime * 0.15 * s);
    } else if (mode === 'kaleidoscope') {
      engine.setParam('rotation', animTime * 0.5 * s);
      engine.setParam('innerRotation', base.innerRotation + Math.sin(t * 0.7 * s) * 45);
      engine.setParam('scale', base.scale + Math.sin(t * 0.3 * s) * 10);
    }
  }

  function animLoop() {
    if(!isAnimating) return;
    animTime++;
    const t = animTime * 0.016;
    applyAnimFrame(currentAnimMode, t, animSpeedMul, animBaseParams);
    engine.generate(currentSeed); glitch.time=animTime; glitch.apply();
    if(asciiMode) updateAscii();
    animFrame = requestAnimationFrame(animLoop);
  }

  function startAutoPlay() {
    btnAnimate.classList.add('active');
    btnAnimate.innerHTML = '◎ STOP';
    triggerRandom();
    const interval = Math.max(100, 500 - animSpeedMul * 25);
    autoPlayInterval = setInterval(triggerRandom, interval);
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

    const trads = Object.keys(TRADITIONS).filter(k=>k!=='custom');
    const randomTrad = trads[Math.floor(Math.random()*trads.length)];
    engine.setTradition(randomTrad);
    document.querySelectorAll('.tradition-btn').forEach(b=>b.classList.toggle('active', b.dataset.tradition===randomTrad));

    const variation = Math.random();
    if (variation > 0.4) {
      const p = engine.params;
      p.rings = Math.max(1, p.rings + Math.floor(Math.random()*5) - 2);
      p.petals = Math.max(1, p.petals + Math.floor(Math.random()*9) - 4);
      p.symmetry = Math.max(1, p.symmetry + Math.floor(Math.random()*7) - 3);
      p.complexity = Math.max(1, Math.min(10, p.complexity + Math.floor(Math.random()*5) - 2));
      p.lineWidth = Math.max(0.3, p.lineWidth + (Math.random()-0.5)*1.5);
      p.innerRotation = Math.max(0, p.innerRotation + Math.floor(Math.random()*20) - 10);
    }

    const objs = Object.keys(SACRED_OBJECTS).filter(k=>k!=='none');
    if (Math.random()>0.5) {
      engine.params.objects.type = objs[Math.floor(Math.random()*objs.length)];
      engine.params.objects.count = 1+Math.floor(Math.random()*8);
      engine.params.objects.size = 10+Math.floor(Math.random()*50);
      engine.params.objects.ring = Math.floor(Math.random()*8);
      engine.params.objects.style = ['stroke','fill','glow'][Math.floor(Math.random()*3)];
    } else { engine.params.objects.type = 'none'; }

    const mantras = Object.keys(MANTRAS).filter(k=>k!=='custom_mantra');
    const randomMantra = mantras[Math.floor(Math.random()*mantras.length)];
    engine.setParam('mantra', randomMantra);
    const mantraSel = document.getElementById('mantraSelect');
    if (mantraSel) mantraSel.value = randomMantra;

    const encodings = ['spiral','radial','hidden','glitch'];
    engine.setParam('mantraEncoding', encodings[Math.floor(Math.random()*encodings.length)]);
    const encSel = document.getElementById('mantraEncoding');
    if (encSel) encSel.value = engine.params.mantraEncoding;

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
      const jsonOpts = document.getElementById('exportJsonOpts');
      if (jsonOpts) jsonOpts.classList.toggle('hidden', currentExportFmt !== 'json');
      const dlBtn = document.getElementById('btnExportConfirm');
      if (currentExportFmt === 'png') dlBtn.innerHTML = '⬡ DOWNLOAD';
      else if (currentExportFmt === 'svg') dlBtn.innerHTML = '⬡ DOWNLOAD SVG';
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


  document.getElementById('btnExportConfirm').addEventListener('click', () => {
    if (currentExportFmt === 'png') exportHiRes(selectedExportRes);
    else if (currentExportFmt === 'svg') exportSVG(selectedSvgRes);
    else exportJSON();
  });

  function exportHiRes(size) {
    const prog=document.getElementById('exportProgress'), fill=document.getElementById('exportProgressFill'), txt=document.getElementById('exportProgressText');
    prog.classList.remove('hidden'); fill.style.width='10%'; txt.textContent=`Rendering ${size}×${size}...`;
    requestAnimationFrame(()=>{
      const ec=document.createElement('canvas'); ec.width=size; ec.height=size;
      const pngTransparent = document.getElementById('pngTransparent');
      engine._noBg = pngTransparent && pngTransparent.checked;
      engine.renderToCanvas(ec, currentSeed);
      engine._noBg = false;
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


  function renderAnimFrame(fc, frame, total, speed, mode, baseParams) {
    const t = (frame / 60) * 0.016 * 60;
    const savedAnimTime = animTime;
    animTime = frame;
    applyAnimFrame(mode, t, speed, baseParams);
    engine.renderToCanvas(fc, currentSeed);
    if (glitch.hasActiveEffects()) {
      const gc = document.createElement('canvas'); gc.width = fc.width; gc.height = fc.height;
      glitch.time = frame * 2; glitch.applyToCanvas(gc.getContext('2d'), fc, fc.width, fc.height);
      fc.getContext('2d').drawImage(gc, 0, 0);
    }
    animTime = savedAnimTime;
  }

  function getRenderProgress() {
    const fill = document.getElementById('renderProgressFill');
    const txt = document.getElementById('renderProgressText');
    const prog = document.getElementById('renderProgress');
    return { fill, txt, prog };
  }

  function showRenderProgress(pct, msg) {
    const { fill, txt, prog } = getRenderProgress();
    prog.classList.remove('hidden');
    fill.style.width = Math.round(pct) + '%';
    txt.textContent = msg;
  }

  function hideRenderProgress(delay) {
    setTimeout(() => { getRenderProgress().prog.classList.add('hidden'); }, delay || 600);
  }

  function exportGIF(size, duration, fps, speed, animMode) {
    showRenderProgress(0, 'Starting...');
    const baseParams = {
      scale: engine.params.scale, innerRotation: engine.params.innerRotation,
      rings: engine.params.rings, petals: engine.params.petals,
      symmetry: engine.params.symmetry, complexity: engine.params.complexity,
      lineWidth: engine.params.lineWidth
    };
    const total = fps * duration, enc = new GIFEncoder(size, size); enc.setDelay(1000 / fps);
    const fc = document.createElement('canvas'); fc.width = size; fc.height = size;
    let frame = 0;
    function next() {
      if (frame >= total) {
        showRenderProgress(95, 'Encoding GIF...');
        requestAnimationFrame(() => {
          const blob = enc.render(), link = document.createElement('a');
          link.download = `meta-mandala-${Date.now()}.gif`; link.href = URL.createObjectURL(blob); link.click();
          showRenderProgress(100, 'Done!');
          hideRenderProgress(1200);
          engine.setParam('rotation', 0); generate();
        }); return;
      }
      renderAnimFrame(fc, frame, total, speed, animMode, baseParams);
      enc.addFrame(fc); frame++;
      showRenderProgress(frame / total * 90, `Frame ${frame}/${total}`);
      requestAnimationFrame(next);
    }
    next();
  }

  async function exportWebM(size, duration, fps, speed, animMode) {
    showRenderProgress(0, 'Starting...');
    const baseParams = {
      scale: engine.params.scale, innerRotation: engine.params.innerRotation,
      rings: engine.params.rings, petals: engine.params.petals,
      symmetry: engine.params.symmetry, complexity: engine.params.complexity,
      lineWidth: engine.params.lineWidth
    };
    const fc = document.createElement('canvas'); fc.width = size; fc.height = size;
    const exp = new VideoExporter(fc, { fps, duration });
    try {
      const blob = await exp.exportWebM((frame, total) => {
        renderAnimFrame(fc, frame, total, speed, animMode, baseParams);
      }, pct => { showRenderProgress(pct * 95, `Recording ${Math.round(pct * 100)}%`); });
      const ext = blob._ext || 'webm';
      const link = document.createElement('a');
      link.download = `meta-mandala-${Date.now()}.${ext}`;
      link.href = URL.createObjectURL(blob); link.click();
      showRenderProgress(100, 'Done!');
    } catch (err) {
      console.error('WebM export error:', err);
      showRenderProgress(100, 'Error: ' + err.message);
    }
    hideRenderProgress(1200);
    engine.setParam('rotation', 0); generate();
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
    updateColorFilter();
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

  // ═══ LIVE RECORD (capture canvas as video) ═══
  let mediaRecorder = null, recordedChunks = [];
  let recTimerInterval = null, recStartTime = 0;
  const btnRecord = document.getElementById('btnRecord');
  const recTimerEl = document.getElementById('recTimer');

  btnRecord.addEventListener('click', ()=>{
    if (mediaRecorder && mediaRecorder.state === 'recording') { stopRecording(); }
    else { startRecording(); }
  });

  function getSupportedMime() {
    const list = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'];
    for (const m of list) { if (MediaRecorder.isTypeSupported(m)) return m; }
    return '';
  }

  function startRecording() {
    const combined = document.createElement('canvas');
    combined.width = mandalaCanvas.width; combined.height = mandalaCanvas.height;
    const cCtx = combined.getContext('2d');
    const cStream = combined.captureStream(30);

    function drawCombined() {
      cCtx.clearRect(0, 0, combined.width, combined.height);
      cCtx.drawImage(mandalaCanvas, 0, 0);
      cCtx.drawImage(glitchCanvas, 0, 0);
      if (mediaRecorder && mediaRecorder.state === 'recording')
        requestAnimationFrame(drawCombined);
    }

    const mime = getSupportedMime();
    const opts = { videoBitsPerSecond: 8000000 };
    if (mime) opts.mimeType = mime;

    try {
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(cStream, opts);
    } catch(err) {
      console.error('MediaRecorder init failed:', err);
      try {
        mediaRecorder = new MediaRecorder(cStream);
        recordedChunks = [];
      } catch(err2) {
        console.error('MediaRecorder fallback failed:', err2);
        alert('Recording not supported in this browser');
        return;
      }
    }

    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onerror = e => { console.error('MediaRecorder error:', e); stopRecording(); };
    mediaRecorder.onstop = () => {
      const ext = (mime && mime.includes('mp4')) ? 'mp4' : 'webm';
      const type = (mime && mime.includes('mp4')) ? 'video/mp4' : 'video/webm';
      const blob = new Blob(recordedChunks, { type });
      const link = document.createElement('a');
      link.download = `meta-mandala-${Date.now()}.${ext}`;
      link.href = URL.createObjectURL(blob);
      link.click();
    };

    mediaRecorder.start(100);
    drawCombined();
    btnRecord.classList.add('rec-active');
    btnRecord.innerHTML = '⏹ STOP';
    recStartTime = Date.now();
    recTimerEl.classList.remove('hidden');
    recTimerEl.textContent = '00:00';
    recTimerInterval = setInterval(()=>{
      const elapsed = Math.floor((Date.now() - recStartTime) / 1000);
      const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const ss = String(elapsed % 60).padStart(2, '0');
      recTimerEl.textContent = `${mm}:${ss}`;
    }, 500);
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
    btnRecord.classList.remove('rec-active');
    btnRecord.innerHTML = '⏺ LIVE REC';
    clearInterval(recTimerInterval);
    recTimerEl.classList.add('hidden');
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

  // ═══ VR MODE TOGGLE ═══
  let vrActive = false;
  let vrLoading = false;
  const vrToggle = document.getElementById('vrToggle');
  const vrCanvas = document.getElementById('vrCanvas');
  vrToggle.addEventListener('click', () => {
    if (vrLoading) return;
    vrActive = !vrActive;
    vrToggle.classList.toggle('vr-active', vrActive);
    if (vrActive) {
      vrLoading = true;
      vrToggle.style.opacity = '0.5';
      mandalaCanvas.style.visibility = 'hidden';
      glitchCanvas.style.visibility = 'hidden';
      vrCanvas.classList.remove('hidden');
      vrCanvas.style.display = 'block';
      window.dispatchEvent(new CustomEvent('vr-enable'));
      setTimeout(() => { vrLoading = false; vrToggle.style.opacity = ''; }, 500);
    } else {
      mandalaCanvas.style.visibility = '';
      glitchCanvas.style.visibility = '';
      vrCanvas.style.display = 'none';
      vrCanvas.classList.add('hidden');
      window.dispatchEvent(new CustomEvent('vr-disable'));
    }
  });

  window._mandala = {
    engine, glitch,
    getSeed: () => currentSeed,
    isVR: () => vrActive,
    rebuild: () => window.dispatchEvent(new CustomEvent('vr-rebuild'))
  };

  const _origGenerate = generate;
  generate = function() {
    _origGenerate();
    if (vrActive) window.dispatchEvent(new CustomEvent('vr-rebuild'));
  };

  // ═══ KEYBOARD ═══
  document.addEventListener('keydown', e=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA') return;
    switch(e.key.toLowerCase()){
      case 'g': currentSeed=Math.random()*99999; generate(); break;
      case 'r': document.getElementById('btnRandom').click(); break;
      case 'e': document.getElementById('btnExport').click(); break;
      case 'f': document.getElementById('btnFullscreen').click(); break;
      case 'a': document.getElementById('btnAscii').click(); break;
      case 'v': vrToggle.click(); break;
      case ' ': e.preventDefault(); btnAnimate.click(); break;
      case 'escape': document.getElementById('exportModal').classList.add('hidden'); break;
    }
  });

  // ═══ COLLAPSIBLE SECTIONS ═══
  document.querySelectorAll('.section-title[data-toggle]').forEach(title => {
    title.addEventListener('click', () => {
      const section = title.closest('.panel-section');
      section.classList.toggle('collapsed');
      const arrow = title.querySelector('.toggle-arrow');
      if (arrow) arrow.textContent = section.classList.contains('collapsed') ? '▸' : '▾';
    });
  });

  // ═══ RENDER VIDEO FROM PANEL ═══
  const btnRecordExport = document.getElementById('btnRecordExport');
  if (btnRecordExport) {
    document.getElementById('recSpeed').addEventListener('input', function(){ updateVal('recSpeed'); });
    btnRecordExport.addEventListener('click', () => {
      const fmt = document.getElementById('recFormat').value;
      const size = parseInt(document.getElementById('recSize').value);
      const dur = parseInt(document.getElementById('recDuration').value);
      const fps = parseInt(document.getElementById('recFps').value);
      const spd = parseInt(document.getElementById('recSpeed').value);
      const mode = animModeSelect.value === 'play' ? 'rotate' : animModeSelect.value;
      if (fmt === 'webm') exportWebM(size, dur, fps, spd, mode);
      else exportGIF(size, dur, fps, spd, mode);
    });
  }

  // ═══ NEW SEED ═══
  document.getElementById('btnNewSeed').addEventListener('click', () => {
    currentSeed = Math.random() * 99999;
    generate();
  });

  // ═══ INIT ═══
  document.getElementById('btnRandom').click();
  console.log('%c☸ META MANDALA', 'color:#9b59b6;font-family:monospace');
});
