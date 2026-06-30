import { createWorker, PSM } from 'tesseract.js';

const OCR_WHITELIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-. ';
const DEFAULT_RESULT = {
  plate_detected: false,
  plate_number: '',
  confidence: 0,
  vehicle_type: 'chưa rõ',
  vehicle_color: 'chưa rõ',
};

let workerPromise: Promise<any> | null = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: OCR_WHITELIST,
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      });
      return worker;
    })();
  }

  return workerPromise;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không thể đọc ảnh để OCR cục bộ.'));
    image.src = dataUrl;
  });
}

function createProcessedCanvas(image: HTMLImageElement) {
  const cropX = Math.floor(image.width * 0.2);
  const cropY = Math.floor(image.height * 0.25);
  const cropWidth = Math.floor(image.width * 0.6);
  const cropHeight = Math.floor(image.height * 0.5);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(cropWidth * 1.8));
  canvas.height = Math.max(1, Math.floor(cropHeight * 1.8));

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Không thể khởi tạo canvas xử lý OCR cục bộ.');
  }

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let grayTotal = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    grayTotal += gray;
  }

  const threshold = grayTotal / (data.length / 4);

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const binary = gray > threshold ? 255 : 0;
    data[i] = binary;
    data[i + 1] = binary;
    data[i + 2] = binary;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function toAlnumUpper(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function inferVehicleType(plate: string) {
  return plate.length >= 9 ? 'ô tô' : 'chưa rõ';
}

function extractBestPlate(rawText: string) {
  const normalizedText = rawText
    .toUpperCase()
    .replace(/[|]/g, '1')
    .replace(/[O]/g, '0')
    .replace(/[—–_]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  const directPatterns = [
    /\b\d{2}[A-Z]\d?-\d{3}\.\d{2}\b/g,
    /\b\d{2}-[A-Z]\d \d{3}\.\d{2}\b/g,
    /\b\d{2}[A-Z]\d{1,2}-\d{3}\.\d{2}\b/g,
  ];

  for (const pattern of directPatterns) {
    const match = normalizedText.match(pattern);
    if (match?.[0]) {
      return match[0].replace(/\s+/g, ' ').trim();
    }
  }

  const compact = toAlnumUpper(normalizedText);

  const carLike = compact.match(/^(\d{2})([A-Z])(\d?)(\d{3})(\d{2})$/);
  if (carLike) {
    const [, province, series, extra, firstBlock, secondBlock] = carLike;
    return `${province}${series}${extra || ''}-${firstBlock}.${secondBlock}`;
  }

  const extendedCarLike = compact.match(/^(\d{2})([A-Z])(\d{2})(\d{3})(\d{2})$/);
  if (extendedCarLike) {
    const [, province, series, extra, firstBlock, secondBlock] = extendedCarLike;
    return `${province}${series}${extra}-${firstBlock}.${secondBlock}`;
  }

  return null;
}

export async function recognizePlateFromDataUrl(dataUrl: string) {
  try {
    const image = await loadImage(dataUrl);
    const canvas = createProcessedCanvas(image);
    const worker = await getWorker();
    const {
      data: { text, confidence },
    } = await worker.recognize(canvas);

    const plate = extractBestPlate(text || '');
    if (!plate) {
      return DEFAULT_RESULT;
    }

    return {
      plate_detected: true,
      plate_number: plate,
      confidence: Math.max(0, Math.min(100, Math.round(confidence || 0))),
      vehicle_type: inferVehicleType(plate),
      vehicle_color: 'chưa rõ',
    };
  } catch {
    return DEFAULT_RESULT;
  }
}
