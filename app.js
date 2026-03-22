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
  let selectedJpgRes = 2048;
  let currentExportFmt = 'png';
  const ASCII_COLS = 120;

  const counterEl = document.getElementById('counterValue');
  let lastLogTime = 0;
  let generatedAt = new Date().toISOString();
  let currentMetaSnapshot = null;
  const metaTrigger = document.getElementById('mandalaMetaTrigger');
  const metaPanel = document.getElementById('mandalaMetaPanel');
  const metaGrid = document.getElementById('mandalaMetaGrid');
  const MANTRA_TEXTS = {
    om_mani:'ॐ मणि पद्मे हूँ',
    gate_gate:'गते गते पारगते',
    om_tare:'ॐ तारे तुत्तारे',
    tayata:'तद्यथा ॐ बेकन्द्ज़े',
    nam_myoho:'南無妙法蓮華經',
    om_ah_hum:'ॐ आः हूँ वज्र गुरु',
    slavic_runes:'ᚠᚢᚦᚨᚱᚲ',
    slavic_prayer:'Слава Роду',
    glagolitic:'ⰀⰁⰂⰃⰄⰅ'
  };
  const DEFAULT_KNOWLEDGE_BASE = {
    version: 'fallback',
    traditions: {
      vajrayana: {
        title: 'diamond vehicle',
        statusLabel: 'canonical mandala lineage',
        tooltip: 'Vajrayana uses mandalas as ritual and contemplative maps of awakened space; this preset stays stylized, but its core frame is historically grounded.',
        summary: 'Tantric Buddhist mandala as an initiatory palace of awakened mind.',
        hidden: 'Union of method and wisdom, transformation of raw force into lucid compassion.',
        caution: 'Stylized interpretation rather than a strict iconographic reconstruction.',
        referenceUrl: 'https://en.wikipedia.org/wiki/Vajrayana'
      },
      theravada: {
        title: 'elder path',
        statusLabel: 'interpretive contemplative mode',
        tooltip: 'Theravada is centered on ethics, meditation, and insight rather than a canonical mandala system, so this preset is intentionally minimalist and interpretive.',
        summary: 'Ascetic contemplative geometry reduced toward discipline, breath and clear seeing.',
        hidden: 'Renunciation, ethical balance and insight into impermanence through restraint.',
        caution: 'Interpretive mode inspired by Theravada values, not a canonical Theravada mandala format.',
        referenceUrl: 'https://en.wikipedia.org/wiki/Theravada'
      },
      zen: {
        title: 'empty mirror',
        statusLabel: 'enso-inspired Zen mode',
        tooltip: 'Zen is represented here through ensō-like reduction: one gesture, one field, less symbolic density, more direct presence.',
        summary: 'Minimal structure echoing ensō logic: one gesture, one field, no excess.',
        hidden: 'Directness, silence and the fertile void behind appearances.',
        caution: 'Interpretive Zen/ensō mode rather than a single canonical mandala program.',
        referenceUrl: 'https://en.wikipedia.org/wiki/Ens%C5%8D'
      },
      tibetan: {
        title: 'sand palace',
        statusLabel: 'ritual Tibetan mandala art',
        tooltip: 'Tibetan sand mandalas build dense sacred palaces with layered gates and directional order, then dissolve them to teach impermanence.',
        summary: 'Ritual cosmogram of the deity realm, dense with gates, layers and consecrated space.',
        hidden: 'Impermanence inside splendor: complexity dissolves back into emptiness.',
        caution: 'Inspired by Tibetan mandala art, but not a reproduction of a named liturgical mandala.',
        referenceUrl: 'https://en.wikipedia.org/wiki/Mandala'
      },
      shingon: {
        title: 'true word matrix',
        statusLabel: 'esoteric Japanese mandala lineage',
        tooltip: 'Shingon centers the Two Realms mandalas, where Mahavairocana, mantra, compassion, and wisdom are ordered into a formal esoteric cosmos.',
        summary: 'Esoteric Japanese field of mantra, lotus unfolding and encoded correspondences.',
        hidden: 'Sound becoming form; sacred speech crystallized into ordered radiance.',
        caution: 'Simplified visual language inspired by Shingon correspondences.',
        referenceUrl: 'https://en.wikipedia.org/wiki/Mandala_of_the_Two_Realms'
      },
      fractal: {
        title: 'recursive gnosis',
        statusLabel: 'modern sacred-math mode',
        tooltip: 'Fractal mode is a contemporary contemplative abstraction: self-similarity, recursion, and scale mirroring rather than a historical ritual tradition.',
        summary: 'Self-similar triangle growth where each scale mirrors the whole.',
        hidden: 'As above, so below: the pattern of mind repeats through every layer.',
        caution: 'Modern symbolic mode rather than a historical sacred lineage.',
        referenceUrl: 'https://en.wikipedia.org/wiki/Fractal'
      },
      slavic: {
        title: 'solar wheel',
        statusLabel: 'modern reconstructive motif set',
        tooltip: 'Slavic mode draws from solar, seasonal, and protective motifs associated with modern Rodnovery; claims of one stable ancient kolovrat meaning are debated.',
        summary: 'Solar-wheel geometry tied to season, hearth, and protection.',
        hidden: 'Cycle, ancestry and life-force moving through remembered and re-imagined sacred order.',
        caution: 'Reconstructive mode: modern Rodnovery usage is clearer than any single ancient unified interpretation.',
        referenceUrl: 'https://en.wikipedia.org/wiki/Slavic_Native_Faith'
      },
      runic: {
        title: 'futhark seal',
        statusLabel: 'interpretive runic sigil mode',
        tooltip: 'Runic mode is based on Elder Futhark letterforms and later esoteric readings; runes are historical inscriptions first, while their use here as radial protective geometry is modern.',
        summary: 'Rune-like angular structure focused on inscription, omen and carved protection.',
        hidden: 'Fate read as pattern: the mark becomes a compact for memory, boundary and will.',
        caution: 'Interpretive adaptation of historical rune forms into mandala-like geometry.',
        referenceUrl: 'https://en.wikipedia.org/wiki/Elder_Futhark'
      },
      custom: {
        title: 'open sigil field',
        statusLabel: 'free synthesis mode',
        tooltip: 'Custom mode drops historical constraints and lets you combine palettes, glyphs and sacred geometry into a personal symbolic field.',
        summary: 'Free synthesis mode where symbols from multiple streams are fused into one artifact.',
        hidden: 'Personal myth-making: meaning is assembled rather than inherited.',
        caution: 'Intentionally ahistorical and combinatory.',
        referenceUrl: ''
      }
    },
    symbols: {
      palettes: {
        samsara: { meaning: 'purple-gold current of transmutation, royalty and awakened abundance' },
        fire: { meaning: 'ritual heat, purification and active deity force' },
        ice: { meaning: 'clarity, stillness and the cool mirror of emptiness' },
        slavic: { meaning: 'solar blood-memory, harvest gold and hearth protection' },
        rune: { meaning: 'moon-metal memory, omen-reading and ancestral warding' }
      },
      objects: {
        none: { meaning: 'no external icon, so the field speaks through pure geometry' },
        buddha: { meaning: 'embodied awakening anchors the center' },
        eye: { meaning: 'the witness principle opens inner sight' },
        dharmachakra: { meaning: 'the wheel marks teaching and lawful motion' },
        deer: { meaning: 'gentleness and listening soften the field' },
        elephant: { meaning: 'steady power and memory root the design' },
        stupa: { meaning: 'relic-mind and sacred ascent stabilize the axis' },
        vajra: { meaning: 'indestructible insight charges the structure' },
        tree: { meaning: 'vertical growth links worlds through one trunk' },
        moon: { meaning: 'reflection and rhythm tune the image to cycles' },
        om: { meaning: 'primordial vibration seals the center' },
        algiz: { meaning: 'protection rises like uplifted antlers', caution: 'Protective readings are common in later esoteric interpretation.' },
        othala: { meaning: 'inheritance and homeland are enclosed and guarded', caution: 'Heritage readings are stronger in later esoteric summaries than in a single fixed early doctrine.' },
        kolovrat: { meaning: 'the sun-wheel sets the field into living rotation', caution: 'Widely used in modern Rodnovery; ancient uniform meaning is debated.' },
        runicStar: { meaning: 'directional force radiates as a warding compass' },
        worldTree: { meaning: 'ancestral axis ties underworld, earth and sky' }
      },
      encodings: {
        spiral: { meaning: 'meaning coils inward and outward as initiation' },
        radial: { meaning: 'meaning radiates from the center into the world' },
        hidden: { meaning: 'meaning remains veiled, active below visibility' },
        glitch: { meaning: 'meaning is fractured so deeper strata leak through the signal' }
      }
    }
  };
  const SHAPE_SYMBOLISM = {
    circle: 'wholeness',
    square: 'order',
    triangle: 'ascent',
    lotus: 'unfolding',
    diamond: 'clarity',
    star: 'radiance'
  };
  let knowledgeBase = DEFAULT_KNOWLEDGE_BASE;

  function normalizeKnowledgeBase(payload) {
    const next = {
      version: (payload && payload.version) || DEFAULT_KNOWLEDGE_BASE.version,
      traditions: { ...DEFAULT_KNOWLEDGE_BASE.traditions },
      symbols: {
        palettes: { ...DEFAULT_KNOWLEDGE_BASE.symbols.palettes },
        objects: { ...DEFAULT_KNOWLEDGE_BASE.symbols.objects },
        encodings: { ...DEFAULT_KNOWLEDGE_BASE.symbols.encodings }
      }
    };
    Object.entries((payload && payload.traditions) || {}).forEach(([key, value]) => {
      next.traditions[key] = { ...(next.traditions[key] || {}), ...value };
    });
    const incomingSymbols = (payload && payload.symbols) || {};
    ['palettes', 'objects', 'encodings'].forEach(section => {
      Object.entries(incomingSymbols[section] || {}).forEach(([key, value]) => {
        next.symbols[section][key] = { ...(next.symbols[section][key] || {}), ...value };
      });
    });
    return next;
  }

  function getTraditionKnowledge(key) {
    return knowledgeBase.traditions[key] || knowledgeBase.traditions.custom || DEFAULT_KNOWLEDGE_BASE.traditions.custom;
  }

  function getPaletteKnowledge(key) {
    return knowledgeBase.symbols.palettes[key] || {};
  }

  function getObjectKnowledge(key) {
    return knowledgeBase.symbols.objects[key] || knowledgeBase.symbols.objects.none || {};
  }

  function getEncodingKnowledge(key) {
    return knowledgeBase.symbols.encodings[key] || knowledgeBase.symbols.encodings.spiral || {};
  }

  async function loadKnowledgeBase() {
    try {
      const res = await fetch('/api/knowledge');
      if (!res.ok) throw new Error('knowledge unavailable');
      knowledgeBase = normalizeKnowledgeBase(await res.json());
      refreshMandalaMeta();
      const activeTradition = document.querySelector('.tradition-btn.active');
      if (activeTradition && tooltip && !tooltip.classList.contains('hidden')) showTraditionTooltip(activeTradition);
    } catch (_) {}
  }

  fetch('/api/count').then(r=>r.json()).then(d=>{ counterEl.textContent = (d.count||0).toLocaleString(); }).catch(()=>{});
  loadKnowledgeBase();

  function generate() {
    if (!isAnimating && !isFlyingInto) generatedAt = new Date().toISOString();
    engine.generate(currentSeed);
    glitch.apply();
    if (asciiMode) updateAscii();
    refreshMandalaMeta();
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

  function updateHeaderMantra(mantraKey) {
    const hm = document.getElementById('headerMantra');
    if (!hm) return;
    hm.textContent = mantraKey === 'custom_mantra'
      ? (engine.params.customMantra || '✎ custom mantra')
      : (MANTRA_TEXTS[mantraKey] || 'ॐ मणि पद्मे हूँ');
  }

  function formatMetaDate(value) {
    return new Date(value).toISOString().replace('T', ' ').slice(0, 19);
  }

  function metaHash(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function buildMandalaMeta() {
    const p = engine.params;
    const cc = glitch.colorCorrection;
    const ref = getTraditionKnowledge(p.tradition);
    const paletteInfo = getPaletteKnowledge(p.palette);
    const objectInfo = getObjectKnowledge(p.objects.type || 'none');
    const encodingInfo = getEncodingKnowledge(p.mantraEncoding);
    const glitchWeight = Object.entries(glitch.params).reduce((sum, [key, value]) => {
      if (key === 'pixelate') return sum + Math.max(0, value - 1);
      return sum + Math.max(0, value || 0);
    }, 0);
    const colorFx = [
      cc.hueRotate ? `h${Math.round(cc.hueRotate)}` : '',
      cc.saturation !== 100 ? `s${Math.round(cc.saturation)}` : '',
      cc.brightness !== 100 ? `b${Math.round(cc.brightness)}` : '',
      cc.contrast !== 100 ? `c${Math.round(cc.contrast)}` : '',
      cc.invert ? `i${Math.round(cc.invert)}` : ''
    ].filter(Boolean);
    const signature = metaHash([
      Math.round(currentSeed),
      p.tradition,
      p.palette,
      [...p.shapes].sort().join('-'),
      p.rings, p.petals, p.symmetry, p.complexity,
      p.scale, p.innerRotation, p.lineWidth,
      glitchWeight,
      colorFx.join('-')
    ].join('|'));
    const shapeMeaning = [...p.shapes]
      .map(shape => SHAPE_SYMBOLISM[shape])
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
    const symmetryMeaning = p.symmetry >= 12
      ? 'high symmetry turns the mandala into a ceremonial lattice'
      : p.symmetry >= 8
        ? 'balanced symmetry reinforces ritual order and protection'
        : p.symmetry >= 4
          ? 'measured symmetry keeps the field stable and readable'
          : 'low symmetry leaves room for intuition, rupture and breath';
    const renderMeaning = p.filledMode
      ? 'filled layers make the force descend into matter and embodiment'
      : p.strokeOnly
        ? 'stroke-only structure keeps the force in a carved, sigil-like state'
        : 'mixed surfaces keep the field between image and sign';
    const glitchMeaning = glitchWeight > 80
      ? 'Heavy glitch suggests the veil is torn and hidden strata are surfacing.'
      : glitchWeight > 20
        ? 'Moderate glitch reads like interference between visible and invisible layers.'
        : 'Minimal glitch keeps the symbol-field clear and devotional.';
    const paletteMeaning = paletteInfo.meaning || 'a transitional palette frames the rite';
    const traditionDescription = `${ref.summary} ${paletteMeaning.charAt(0).toUpperCase() + paletteMeaning.slice(1)}.`;
    const knowledgeNote = [ref.caution, objectInfo.caution].filter(Boolean).join(' ');
    const hiddenSense = [
      ref.hidden,
      shapeMeaning ? `Forms emphasize ${shapeMeaning}.` : '',
      symmetryMeaning.charAt(0).toUpperCase() + symmetryMeaning.slice(1) + '.',
      renderMeaning.charAt(0).toUpperCase() + renderMeaning.slice(1) + '.',
      `${objectInfo.meaning || getObjectKnowledge('none').meaning}.`,
      `${encodingInfo.meaning || getEncodingKnowledge('spiral').meaning}.`,
      glitchMeaning
    ].filter(Boolean).join(' ');
    return {
      version: knowledgeBase.version || '0.4.1',
      signature,
      generatedAt,
      seed: Math.round(currentSeed),
      tradition: p.tradition,
      traditionTitle: ref.title,
      traditionDescription,
      hiddenSense,
      basis: ref.statusLabel || 'free symbolic mode',
      knowledgeNote,
      palette: p.palette,
      mantra: p.mantra === 'custom_mantra' ? (p.customMantra || 'custom mantra') : (MANTRA_TEXTS[p.mantra] || p.mantra),
      geometry: `${p.rings}r / ${p.petals}p / ${p.symmetry}s / ${p.complexity}c`,
      forms: [...p.shapes].join(', '),
      sacredObject: p.objects.type === 'none' ? 'none' : `${p.objects.type} ×${p.objects.count}`,
      glitch: glitchWeight > 0 ? `active ${Math.round(glitchWeight)}` : 'clean',
      colorFx: colorFx.length ? colorFx.join(' · ') : 'neutral'
    };
  }

  function refreshMandalaMeta() {
    if (!metaGrid) return;
    currentMetaSnapshot = buildMandalaMeta();
    const rows = [
      { label: 'sigil', value: currentMetaSnapshot.signature },
      { label: 'generated', value: formatMetaDate(currentMetaSnapshot.generatedAt) },
      { label: 'seed', value: String(currentMetaSnapshot.seed) },
      { label: 'tradition', value: `${currentMetaSnapshot.tradition} · ${currentMetaSnapshot.traditionTitle}` },
      { label: 'basis', value: currentMetaSnapshot.basis },
      { label: 'reading', value: currentMetaSnapshot.traditionDescription, long: true },
      { label: 'hidden sense', value: currentMetaSnapshot.hiddenSense, long: true },
      ...(currentMetaSnapshot.knowledgeNote ? [{ label: 'note', value: currentMetaSnapshot.knowledgeNote, long: true }] : []),
      { label: 'palette', value: currentMetaSnapshot.palette },
      { label: 'geometry', value: currentMetaSnapshot.geometry },
      { label: 'forms', value: currentMetaSnapshot.forms },
      { label: 'mantra', value: currentMetaSnapshot.mantra },
      { label: 'object', value: currentMetaSnapshot.sacredObject },
      { label: 'glitch', value: currentMetaSnapshot.glitch },
      { label: 'color fx', value: currentMetaSnapshot.colorFx }
    ];
    metaGrid.innerHTML = rows.map(row =>
      `<div class="mandala-meta-row${row.long ? ' long' : ''}"><span>${escapeHTML(row.label)}</span><strong>${escapeHTML(row.value)}</strong></div>`
    ).join('');
  }

  function syncMetaHoverState() {
    if (!metaTrigger || !metaPanel) return;
    const hovered = metaTrigger.matches(':hover') || metaPanel.matches(':hover');
    metaPanel.classList.toggle('hidden', !hovered);
  }

  if (metaTrigger && metaPanel) {
    ['mouseenter','mouseleave'].forEach(evt => {
      metaTrigger.addEventListener(evt, () => requestAnimationFrame(syncMetaHoverState));
      metaPanel.addEventListener(evt, () => requestAnimationFrame(syncMetaHoverState));
    });
  }

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
    const ref = getTraditionKnowledge(btn.dataset.tradition);
    const info = ref.tooltip || btn.dataset.info;
    const link = ref.referenceUrl || btn.dataset.link;
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
    updateHeaderMantra(v);
    generate();
  });
  customMantraInput.addEventListener('input', ()=>{
    engine.setParam('customMantra', customMantraInput.value);
    if (engine.params.mantra === 'custom_mantra') updateHeaderMantra('custom_mantra');
    generate();
  });
  document.getElementById('mantraEncoding').addEventListener('change', function(){ engine.setParam('mantraEncoding', this.value); generate(); });
  document.getElementById('mantraOpacity').addEventListener('input', function(){ updateVal('mantraOpacity'); engine.setParam('mantraOpacity', parseInt(this.value)/100); generate(); });

  // ═══ GLITCH ═══
  const glitchIds = ['rgbShift','noise','scanlines','distortion','pixelate','flicker'];
  glitchIds.forEach(id => {
    const el = document.getElementById(id); if(!el) return;
    el.addEventListener('input', ()=>{
      updateVal(id);
      glitch.setParam(id, parseFloat(el.value));
      generatedAt = new Date().toISOString();
      glitch.apply();
      refreshMandalaMeta();
    });
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
      generatedAt = new Date().toISOString();
      updateColorFilter();
      refreshMandalaMeta();
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
  const btnRandom = document.getElementById('btnRandom');
  const btnRandomStream = document.getElementById('btnRandomStream');
  const randomSingleTradition = document.getElementById('randomSingleTradition');
  const animSpeedSlider = document.getElementById('animSpeed');
  let randomStreamInterval = null;
  let currentAnimMode = 'kaleidoscope';
  let animBaseParams = {};
  let animSpeedMul = 5;
  let animStartTs = 0;
  let animLastTs = 0;

  animSpeedSlider.addEventListener('input', function(){
    updateVal('animSpeed');
    animSpeedMul = parseInt(this.value);
    if (randomStreamInterval) restartRandomStream();
  });

  btnAnimate.addEventListener('click', () => {
    if (isFlyingInto) { stopFlyInto(); document.getElementById('btnFlyInto').classList.remove('active'); document.getElementById('btnFlyInto').innerHTML='⊛ FLY INTO'; }
    if (isAnimating) stopAll();
    else {
      currentAnimMode = animModeSelect.value;
      startAnim();
    }
  });

  function stopAll() {
    if (isAnimating) stopAnim();
    btnAnimate.classList.remove('active');
    btnAnimate.innerHTML = '◎ START';
    btnAnimate.style.borderColor = '';
    btnAnimate.style.color = '';
  }

  function startAnim() {
    isAnimating=true; animTime=0; animStartTs=0; animLastTs=0;
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
    animFrame = requestAnimationFrame(animLoop);
  }

  function stopAnim() {
    isAnimating=false;
    if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
    animStartTs = 0;
    animLastTs = 0;
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
      engine.setParam('rotation', t * 18 * s);
    } else if (mode === 'pulse') {
      engine.setParam('scale', base.scale + Math.sin(t * 2 * s) * 20);
      engine.setParam('rotation', t * 6 * s);
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
      engine.setParam('rotation', t * 9 * s);
    } else if (mode === 'vortex') {
      engine.setParam('rotation', t * 52 * s);
      engine.setParam('innerRotation', base.innerRotation + Math.sin(t * 1.4 * s) * 70);
      engine.setParam('scale', base.scale + Math.sin(t * 0.8 * s) * 14);
      engine.setParam('lineWidth', Math.max(0.3, base.lineWidth + Math.sin(t * 2.2 * s) * 0.9));
    } else if (mode === 'shimmer') {
      engine.setParam('rotation', t * 12 * s);
      engine.setParam('scale', base.scale + Math.sin(t * 3.8 * s) * 4 + Math.sin(t * 7.2 * s) * 2);
      engine.setParam('innerRotation', base.innerRotation + Math.sin(t * 4.5 * s) * 18);
      engine.setParam('lineWidth', Math.max(0.2, base.lineWidth + Math.sin(t * 6.4 * s) * 0.35));
    } else if (mode === 'oracle') {
      engine.setParam('rotation', t * 9 * s + Math.sin(t * 0.9 * s) * 20);
      engine.setParam('scale', base.scale + Math.sin(t * 0.45 * s) * 12);
      engine.setParam('innerRotation', base.innerRotation + Math.sin(t * 0.35 * s) * 90);
      engine.setParam('symmetry', Math.max(1, Math.round(base.symmetry + Math.sin(t * 0.5 * s) * 2)));
    } else if (mode === 'kaleidoscope') {
      engine.setParam('rotation', t * 30 * s);
      engine.setParam('innerRotation', base.innerRotation + Math.sin(t * 0.7 * s) * 45);
      engine.setParam('scale', base.scale + Math.sin(t * 0.3 * s) * 10);
    }
  }

  function animLoop(ts) {
    if(!isAnimating) return;
    if (!animStartTs) { animStartTs = ts; animLastTs = ts; }
    const deltaSec = Math.min(0.05, (ts - animLastTs) / 1000);
    animLastTs = ts;
    const t = (ts - animStartTs) / 1000;
    animTime = t * 60;
    applyAnimFrame(currentAnimMode, t, animSpeedMul, animBaseParams);
    engine.generate(currentSeed); glitch.time += deltaSec * 60; glitch.apply();
    if(asciiMode) updateAscii();
    animFrame = requestAnimationFrame(animLoop);
  }

  function getRandomModeIntervalMs(speed) {
    return Math.max(120, 1500 - speed * 70);
  }

  function makeSeededRng(seed) {
    let state = (seed >>> 0) || 1;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function captureStateSnapshot() {
    const p = engine.params;
    return {
      seed: currentSeed,
      generatedAt,
      params: {
        rings: p.rings, petals: p.petals, symmetry: p.symmetry, complexity: p.complexity,
        scale: p.scale, lineWidth: p.lineWidth, innerRotation: p.innerRotation,
        fractalDepth: p.fractalDepth, strokeOnly: p.strokeOnly, filledMode: p.filledMode,
        palette: p.palette, tradition: p.tradition, mantra: p.mantra,
        mantraEncoding: p.mantraEncoding, mantraOpacity: p.mantraOpacity,
        customMantra: p.customMantra || '', customText: p.customText || '',
        customTextSize: p.customTextSize || 12, customTextRing: p.customTextRing || 5,
        rotation: p.rotation || 0, shapes: Array.from(p.shapes),
        objects: { ...p.objects }, customGradient: { ...p.customGradient }
      },
      glitch: { ...glitch.params },
      colorCorrection: { ...glitch.colorCorrection }
    };
  }

  function applyStateSnapshot(snapshot) {
    currentSeed = snapshot.seed;
    if (snapshot.generatedAt) generatedAt = snapshot.generatedAt;
    const p = snapshot.params;
    Object.assign(engine.params, {
      rings: p.rings, petals: p.petals, symmetry: p.symmetry, complexity: p.complexity,
      scale: p.scale, lineWidth: p.lineWidth, innerRotation: p.innerRotation,
      fractalDepth: p.fractalDepth, strokeOnly: p.strokeOnly, filledMode: p.filledMode,
      palette: p.palette, tradition: p.tradition, mantra: p.mantra,
      mantraEncoding: p.mantraEncoding, mantraOpacity: p.mantraOpacity,
      customMantra: p.customMantra || '', customText: p.customText || '',
      customTextSize: p.customTextSize || 12, customTextRing: p.customTextRing || 5,
      rotation: p.rotation || 0
    });
    engine.params.shapes = new Set(p.shapes || []);
    engine.params.objects = { ...engine.params.objects, ...(p.objects || {}) };
    engine.params.customGradient = { ...engine.params.customGradient, ...(p.customGradient || {}) };
    Object.keys(snapshot.glitch || {}).forEach(k => glitch.setParam(k, snapshot.glitch[k]));
    Object.keys(snapshot.colorCorrection || {}).forEach(k => glitch.setColorCorrection(k, snapshot.colorCorrection[k]));
  }

  function buildSnapshotCanvas(snapshot, size) {
    const restore = captureStateSnapshot();
    applyStateSnapshot(snapshot);
    const base = document.createElement('canvas');
    base.width = size; base.height = size;
    engine.renderToCanvas(base, currentSeed);
    let result = base;
    if (glitch.hasActiveEffects()) {
      const effected = document.createElement('canvas');
      effected.width = size; effected.height = size;
      glitch.applyToCanvas(effected.getContext('2d'), base, size, size);
      result = effected;
    }
    applyStateSnapshot(restore);
    return result;
  }

  function syncSnapshotUI(snapshot) {
    applyStateSnapshot(snapshot);
    document.querySelectorAll('.tradition-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tradition === engine.params.tradition);
    });
    const mantraSel = document.getElementById('mantraSelect');
    if (mantraSel) mantraSel.value = engine.params.mantra;
    const encSel = document.getElementById('mantraEncoding');
    if (encSel) encSel.value = engine.params.mantraEncoding;
    updateHeaderMantra(engine.params.mantra);
    syncUI(); syncGlitchUI(); syncObjectsUI(); refreshMandalaMeta();
  }

  function drawTransitionBlend(ctx, currentCanvas, nextCanvas, progress, w, h) {
    const p = Math.min(1, Math.max(0, progress));
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 1 - p;
    ctx.translate(w/2, h/2);
    ctx.scale(1 + p * 0.18, 1 + p * 0.18);
    ctx.rotate(-p * 0.08);
    ctx.drawImage(currentCanvas, -w/2, -h/2, w, h);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = Math.min(1, p * 1.15);
    ctx.translate(w/2, h/2);
    ctx.scale(0.82 + p * 0.18, 0.82 + p * 0.18);
    ctx.rotate((1 - p) * 0.05);
    ctx.drawImage(nextCanvas, -w/2, -h/2, w, h);
    ctx.restore();
  }

  function applyRandomization(rand = Math.random) {
    currentSeed = rand()*99999;

    const trads = Object.keys(TRADITIONS).filter(k=>k!=='custom');
    const preserveTradition = randomSingleTradition && randomSingleTradition.checked && engine.params.tradition !== 'custom';
    const randomTrad = preserveTradition
      ? engine.params.tradition
      : trads[Math.floor(rand()*trads.length)];
    engine.setTradition(randomTrad);

    const variation = rand();
    if (variation > 0.4) {
      const p = engine.params;
      p.rings = Math.max(1, p.rings + Math.floor(rand()*5) - 2);
      p.petals = Math.max(1, p.petals + Math.floor(rand()*9) - 4);
      p.symmetry = Math.max(1, p.symmetry + Math.floor(rand()*7) - 3);
      p.complexity = Math.max(1, Math.min(10, p.complexity + Math.floor(rand()*5) - 2));
      p.lineWidth = Math.max(0.3, p.lineWidth + (rand()-0.5)*1.5);
      p.innerRotation = Math.max(0, p.innerRotation + Math.floor(rand()*20) - 10);
    }

    const objs = Object.keys(SACRED_OBJECTS).filter(k=>k!=='none');
    if (rand()>0.5) {
      engine.params.objects.type = objs[Math.floor(rand()*objs.length)];
      engine.params.objects.count = 1+Math.floor(rand()*8);
      engine.params.objects.size = 10+Math.floor(rand()*50);
      engine.params.objects.ring = Math.floor(rand()*8);
      engine.params.objects.style = ['stroke','fill','glow'][Math.floor(rand()*3)];
    } else { engine.params.objects.type = 'none'; }

    const mantras = Object.keys(MANTRAS).filter(k=>k!=='custom_mantra');
    const randomMantra = mantras[Math.floor(rand()*mantras.length)];
    engine.setParam('mantra', randomMantra);

    const encodings = ['spiral','radial','hidden','glitch'];
    engine.setParam('mantraEncoding', encodings[Math.floor(rand()*encodings.length)]);

    glitch.setParam('rgbShift', Math.floor(rand()*15));
    glitch.setParam('noise', Math.floor(rand()*40));
    glitch.setParam('scanlines', Math.floor(rand()*60));
    glitch.setParam('distortion', Math.floor(rand()*20));

    return { randomTrad, randomMantra };
  }

  function buildRandomTimeline(duration, fps, speed, size) {
    const totalFrames = fps * duration;
    const framesPerStep = Math.max(1, Math.round(getRandomModeIntervalMs(speed) / (1000 / fps)));
    const original = captureStateSnapshot();
    const rng = makeSeededRng(Math.round(currentSeed) || 1);
    const entries = [{
      snapshot: original,
      canvas: buildSnapshotCanvas(original, size)
    }];
    const stepCount = Math.max(1, Math.ceil(totalFrames / framesPerStep));
    for (let i = 0; i < stepCount; i++) {
      applyRandomization(rng);
      const snapshot = captureStateSnapshot();
      entries.push({
        snapshot,
        canvas: buildSnapshotCanvas(snapshot, size)
      });
    }
    applyStateSnapshot(original);
    return { entries, framesPerStep, original };
  }

  function setRandomButtonState(isRunning) {
    btnRandomStream.classList.toggle('active', isRunning);
    btnRandomStream.innerHTML = isRunning ? '❚❚' : '▶';
  }

  function startRandomStream() {
    triggerRandom();
    randomStreamInterval = setInterval(triggerRandom, getRandomModeIntervalMs(animSpeedMul));
    setRandomButtonState(true);
  }

  function stopRandomStream() {
    clearInterval(randomStreamInterval);
    randomStreamInterval = null;
    setRandomButtonState(false);
  }

  function restartRandomStream() {
    if (!randomStreamInterval) return;
    stopRandomStream();
    startRandomStream();
  }

  function triggerRandom() {
    const { randomTrad, randomMantra } = applyRandomization();
    document.querySelectorAll('.tradition-btn').forEach(b=>b.classList.toggle('active', b.dataset.tradition===randomTrad));
    const mantraSel = document.getElementById('mantraSelect');
    if (mantraSel) mantraSel.value = randomMantra;
    const encSel = document.getElementById('mantraEncoding');
    if (encSel) encSel.value = engine.params.mantraEncoding;
    updateHeaderMantra(randomMantra);
    syncUI(); syncGlitchUI(); syncObjectsUI(); generate();
  }

  btnRandomStream.addEventListener('click', () => {
    if (randomStreamInterval) stopRandomStream();
    else startRandomStream();
  });

  // ═══ FLY-INTO — smooth procedural tunnel ═══
  document.getElementById('btnFlyInto').addEventListener('click', ()=>{
    if (isAnimating) { stopAll(); }
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

  document.getElementById('btnRandom').addEventListener('click', ()=>{
    const { randomTrad, randomMantra } = applyRandomization();
    document.querySelectorAll('.tradition-btn').forEach(b=>b.classList.toggle('active', b.dataset.tradition===randomTrad));
    const mantraSel = document.getElementById('mantraSelect');
    if (mantraSel) mantraSel.value = randomMantra;
    updateHeaderMantra(randomMantra);
    const encSel = document.getElementById('mantraEncoding');
    if (encSel) encSel.value = engine.params.mantraEncoding;

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
      const jpgOpts = document.getElementById('exportJpgOpts');
      if (jpgOpts) jpgOpts.classList.toggle('hidden', currentExportFmt !== 'jpg');
      document.getElementById('exportSvgOpts').classList.toggle('hidden', currentExportFmt !== 'svg');
      const jsonOpts = document.getElementById('exportJsonOpts');
      if (jsonOpts) jsonOpts.classList.toggle('hidden', currentExportFmt !== 'json');
      const dlBtn = document.getElementById('btnExportConfirm');
      if (currentExportFmt === 'png') dlBtn.innerHTML = '⬡ DOWNLOAD';
      else if (currentExportFmt === 'jpg') dlBtn.innerHTML = '⬡ DOWNLOAD JPG';
      else if (currentExportFmt === 'svg') dlBtn.innerHTML = '⬡ DOWNLOAD SVG';
      else dlBtn.innerHTML = '⬡ EXPORT JSON';
    });
  });

  document.querySelectorAll('#exportPngOpts .export-res-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#exportPngOpts .export-res-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); selectedExportRes=parseInt(btn.dataset.w);
    });
  });
  document.querySelectorAll('.svg-res-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.svg-res-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); selectedSvgRes=parseInt(btn.dataset.w);
    });
  });
  document.querySelectorAll('.jpg-res-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.jpg-res-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); selectedJpgRes=parseInt(btn.dataset.w);
    });
  });


  document.getElementById('btnExportConfirm').addEventListener('click', () => {
    if (currentExportFmt === 'png') exportHiRes(selectedExportRes);
    else if (currentExportFmt === 'jpg') exportHiRes(selectedJpgRes, 'jpg');
    else if (currentExportFmt === 'svg') exportSVG(selectedSvgRes);
    else exportJSON();
  });

  function exportHiRes(size, format = 'png') {
    const prog=document.getElementById('exportProgress'), fill=document.getElementById('exportProgressFill'), txt=document.getElementById('exportProgressText');
    prog.classList.remove('hidden'); fill.style.width='10%'; txt.textContent=`Rendering ${size}×${size}...`;
    requestAnimationFrame(()=>{
      const ec=document.createElement('canvas'); ec.width=size; ec.height=size;
      const pngTransparent = document.getElementById('pngTransparent');
      engine._noBg = format === 'png' && pngTransparent && pngTransparent.checked;
      engine.renderToCanvas(ec, currentSeed);
      engine._noBg = false;
      fill.style.width='60%';
      const finalCanvas = buildFinalCompositeCanvas(ec, size);
      fill.style.width='90%'; txt.textContent='Encoding...';
      requestAnimationFrame(()=>{
        const link=document.createElement('a');
        const ext = format === 'jpg' ? 'jpg' : 'png';
        link.download=`meta-mandala-${size}px-${Date.now()}.${ext}`;
        link.href = format === 'jpg'
          ? finalCanvas.toDataURL('image/jpeg', 0.95)
          : finalCanvas.toDataURL('image/png');
        link.click();
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


  function renderAnimFrame(fc, frame, total, fps, speed, mode, baseParams, randomTimeline) {
    const t = frame / fps;
    const virtualFrame = frame * (60 / fps);
    const savedAnimTime = animTime;
    if (mode === 'random' && randomTimeline) {
      const idx = Math.min(randomTimeline.entries.length - 2, Math.floor(frame / randomTimeline.framesPerStep));
      const progress = (frame % randomTimeline.framesPerStep) / randomTimeline.framesPerStep;
      drawTransitionBlend(fc.getContext('2d'), randomTimeline.entries[idx].canvas, randomTimeline.entries[idx + 1].canvas, progress, fc.width, fc.height);
    } else {
      animTime = virtualFrame;
      applyAnimFrame(mode, t, speed, baseParams);
      engine.renderToCanvas(fc, currentSeed);
      glitch.time = virtualFrame * 2;
      const finalCanvas = buildFinalCompositeCanvas(fc, fc.width);
      const ctx = fc.getContext('2d');
      ctx.clearRect(0, 0, fc.width, fc.height);
      ctx.drawImage(finalCanvas, 0, 0);
    }
    animTime = savedAnimTime;
  }

  function buildFinalCompositeCanvas(sourceCanvas, size) {
    const out = document.createElement('canvas');
    out.width = size;
    out.height = size;
    const outCtx = out.getContext('2d');
    outCtx.clearRect(0, 0, size, size);
    outCtx.drawImage(sourceCanvas, 0, 0, size, size);
    if (glitch.hasGlitchEffects()) {
      const overlay = document.createElement('canvas');
      overlay.width = size;
      overlay.height = size;
      glitch.applyEffectsToCanvas(overlay.getContext('2d'), sourceCanvas, size, size);
      outCtx.drawImage(overlay, 0, 0, size, size);
    }
    if (glitch.hasColorCorrection()) {
      glitch.applyColorCorrectionToCanvas(outCtx, size, size);
    }
    return out;
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
    const originalState = captureStateSnapshot();
    const baseParams = {
      scale: engine.params.scale, innerRotation: engine.params.innerRotation,
      rings: engine.params.rings, petals: engine.params.petals,
      symmetry: engine.params.symmetry, complexity: engine.params.complexity,
      lineWidth: engine.params.lineWidth
    };
    const randomTimeline = animMode === 'random' ? buildRandomTimeline(duration, fps, speed, size) : null;
    const total = fps * duration, enc = new GIFEncoder(size, size); enc.setDelay(1000 / fps);
    const fc = document.createElement('canvas'); fc.width = size; fc.height = size;
    let frame = 0;
    return new Promise(resolve => {
      function next() {
        if (frame >= total) {
          showRenderProgress(95, 'Encoding GIF...');
          requestAnimationFrame(() => {
            const blob = enc.render(), link = document.createElement('a');
            link.download = `meta-mandala-${Date.now()}.gif`; link.href = URL.createObjectURL(blob); link.click();
            showRenderProgress(100, 'Done!');
            hideRenderProgress(1200);
            applyStateSnapshot(originalState);
            engine.setParam('rotation', 0); generate();
            resolve();
          });
          return;
        }
        renderAnimFrame(fc, frame, total, fps, speed, animMode, baseParams, randomTimeline);
        enc.addFrame(fc); frame++;
        showRenderProgress(frame / total * 90, `Frame ${frame}/${total}`);
        requestAnimationFrame(next);
      }
      next();
    });
  }

  async function exportWebM(size, duration, fps, speed, animMode, format) {
    showRenderProgress(0, 'Starting...');
    const originalState = captureStateSnapshot();
    const baseParams = {
      scale: engine.params.scale, innerRotation: engine.params.innerRotation,
      rings: engine.params.rings, petals: engine.params.petals,
      symmetry: engine.params.symmetry, complexity: engine.params.complexity,
      lineWidth: engine.params.lineWidth
    };
    const randomTimeline = animMode === 'random' ? buildRandomTimeline(duration, fps, speed, size) : null;
    const fc = document.createElement('canvas'); fc.width = size; fc.height = size;
    const exp = new VideoExporter(fc, { fps, duration, format });
    try {
      const blob = await exp.exportWebM((frame, total) => {
        renderAnimFrame(fc, frame, total, fps, speed, animMode, baseParams, randomTimeline);
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
    applyStateSnapshot(originalState);
    engine.setParam('rotation', 0); generate();
  }

  // ═══ JSON EXPORT / IMPORT ═══
  function buildMandalaJSON() {
    const p = engine.params;
    return {
      version: '0.4.1',
      seed: currentSeed,
      meta: buildMandalaMeta(),
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
    if (data.meta && data.meta.generatedAt) generatedAt = data.meta.generatedAt;
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
      updateHeaderMantra(p.mantra);
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

  const btnRecord = document.getElementById('btnRecord');
  function setRecordButtonState(isBusy) {
    if (!btnRecord) return;
    btnRecord.disabled = isBusy;
    btnRecord.classList.toggle('rec-active', isBusy);
    btnRecord.innerHTML = isBusy ? '⏳ RENDERING...' : '⏺ RECORD VIDEO';
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
  if (btnRecord) {
    document.getElementById('recSpeed').addEventListener('input', function(){ updateVal('recSpeed'); });
    btnRecord.addEventListener('click', async () => {
      if (btnRecord.disabled) return;
      const fmt = document.getElementById('recFormat').value;
      const size = parseInt(document.getElementById('recSize').value);
      const dur = parseInt(document.getElementById('recDuration').value);
      const fps = parseInt(document.getElementById('recFps').value);
      const spd = parseInt(document.getElementById('recSpeed').value);
      const mode = animModeSelect.value;
      setRecordButtonState(true);
      try {
        if (fmt === 'gif') await exportGIF(size, dur, fps, spd, mode);
        else await exportWebM(size, dur, fps, spd, mode, fmt);
      } finally {
        setRecordButtonState(false);
      }
    });
  }

  // ═══ INIT ═══
  animModeSelect.value = 'kaleidoscope';
  currentAnimMode = 'kaleidoscope';
  document.getElementById('btnRandom').click();
  updateHeaderMantra(engine.params.mantra);
  console.log('%c☸ META MANDALA', 'color:#9b59b6;font-family:monospace');
});
