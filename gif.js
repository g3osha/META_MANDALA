class GIFEncoder {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.frames = [];
    this.delay = 100;
  }

  setDelay(ms) {
    this.delay = ms;
  }

  addFrame(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, this.width, this.height);
    this.frames.push({
      data: new Uint8Array(imageData.data),
      delay: this.delay
    });
  }

  render() {
    const pixels = this.width * this.height;
    const quantizedFrames = this.frames.map(frame => {
      const indexed = new Uint8Array(pixels);
      const palette = this._buildPalette(frame.data);
      for (let i = 0; i < pixels; i++) {
        const off = i * 4;
        indexed[i] = this._findClosest(palette, frame.data[off], frame.data[off+1], frame.data[off+2]);
      }
      return { indexed, palette, delay: frame.delay };
    });

    const blocks = [];
    blocks.push(this._header());
    blocks.push(this._logicalScreenDescriptor());
    blocks.push(this._applicationExtension());

    for (const frame of quantizedFrames) {
      blocks.push(this._graphicControlExtension(frame.delay));
      blocks.push(this._imageDescriptor());
      blocks.push(this._colorTable(frame.palette));
      blocks.push(this._imageData(frame.indexed, frame.palette));
    }

    blocks.push(new Uint8Array([0x3B]));

    let totalLen = 0;
    for (const b of blocks) totalLen += b.length;
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const b of blocks) {
      result.set(b, offset);
      offset += b.length;
    }

    return new Blob([result], { type: 'image/gif' });
  }

  _buildPalette(data) {
    const colorCounts = new Map();
    const step = Math.max(1, Math.floor(data.length / 4 / 10000));

    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i] >> 3;
      const g = data[i+1] >> 3;
      const b = data[i+2] >> 3;
      const key = (r << 10) | (g << 5) | b;
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    }

    const sorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
    const palette = new Uint8Array(256 * 3);

    for (let i = 0; i < 256 && i < sorted.length; i++) {
      const key = sorted[i][0];
      palette[i * 3] = ((key >> 10) & 31) << 3;
      palette[i * 3 + 1] = ((key >> 5) & 31) << 3;
      palette[i * 3 + 2] = (key & 31) << 3;
    }

    return palette;
  }

  _findClosest(palette, r, g, b) {
    let minDist = Infinity;
    let best = 0;
    for (let i = 0; i < 256; i++) {
      const dr = r - palette[i * 3];
      const dg = g - palette[i * 3 + 1];
      const db = b - palette[i * 3 + 2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < minDist) {
        minDist = dist;
        best = i;
        if (dist === 0) break;
      }
    }
    return best;
  }

  _header() {
    return new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  }

  _logicalScreenDescriptor() {
    const buf = new Uint8Array(7);
    buf[0] = this.width & 0xFF;
    buf[1] = (this.width >> 8) & 0xFF;
    buf[2] = this.height & 0xFF;
    buf[3] = (this.height >> 8) & 0xFF;
    buf[4] = 0x00;
    buf[5] = 0;
    buf[6] = 0;
    return buf;
  }

  _applicationExtension() {
    return new Uint8Array([
      0x21, 0xFF, 0x0B,
      0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30,
      0x03, 0x01, 0x00, 0x00, 0x00
    ]);
  }

  _graphicControlExtension(delay) {
    const d = Math.round(delay / 10);
    return new Uint8Array([
      0x21, 0xF9, 0x04, 0x00,
      d & 0xFF, (d >> 8) & 0xFF,
      0x00, 0x00
    ]);
  }

  _imageDescriptor() {
    const buf = new Uint8Array(10);
    buf[0] = 0x2C;
    buf[1] = buf[2] = buf[3] = buf[4] = 0;
    buf[5] = this.width & 0xFF;
    buf[6] = (this.width >> 8) & 0xFF;
    buf[7] = this.height & 0xFF;
    buf[8] = (this.height >> 8) & 0xFF;
    buf[9] = 0x87;
    return buf;
  }

  _colorTable(palette) {
    return palette;
  }

  _imageData(indexed, palette) {
    const minCodeSize = 8;
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;

    const output = [minCodeSize];
    const subBlocks = [];

    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    const maxCode = 4095;

    let bitBuffer = 0;
    let bitCount = 0;
    const bytes = [];

    function writeBits(code, size) {
      bitBuffer |= code << bitCount;
      bitCount += size;
      while (bitCount >= 8) {
        bytes.push(bitBuffer & 0xFF);
        bitBuffer >>= 8;
        bitCount -= 8;
      }
    }

    writeBits(clearCode, codeSize);

    const table = new Map();
    let prev = indexed[0];

    for (let i = 1; i < indexed.length; i++) {
      const curr = indexed[i];
      const key = (prev << 12) | curr;

      if (table.has(key)) {
        prev = table.get(key);
      } else {
        writeBits(prev, codeSize);

        if (nextCode <= maxCode) {
          table.set(key, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        } else {
          writeBits(clearCode, codeSize);
          table.clear();
          codeSize = minCodeSize + 1;
          nextCode = eoiCode + 1;
        }

        prev = curr;
      }
    }

    writeBits(prev, codeSize);
    writeBits(eoiCode, codeSize);

    if (bitCount > 0) {
      bytes.push(bitBuffer & 0xFF);
    }

    for (let i = 0; i < bytes.length; i += 255) {
      const chunk = bytes.slice(i, i + 255);
      subBlocks.push(chunk.length);
      subBlocks.push(...chunk);
    }
    subBlocks.push(0);

    const result = new Uint8Array(1 + subBlocks.length);
    result[0] = minCodeSize;
    result.set(new Uint8Array(subBlocks), 1);
    return result;
  }
}

class VideoExporter {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.fps = options.fps || 15;
    this.duration = options.duration || 3;
  }

  async exportWebM(renderFrame, onProgress) {
    const stream = this.canvas.captureStream(this.fps);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    });

    const chunks = [];
    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      recorder.start();
      const totalFrames = this.fps * this.duration;
      let frame = 0;

      const captureFrame = () => {
        if (frame >= totalFrames) {
          recorder.stop();
          return;
        }

        renderFrame(frame, totalFrames);
        frame++;
        if (onProgress) onProgress(frame / totalFrames);
        requestAnimationFrame(captureFrame);
      };

      captureFrame();
    });
  }
}
