import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface AppState {
  employees: any[];
  prizes: any[];
  winners: any[];
  settings: any;
  adminPin: string;
  mcPin: string;
  riggedSettings: any[];
  activePrizeId?: string;
  activeSpinCount?: number;
  spinTrigger?: {
    prizeId: string;
    quantity: number;
    timestamp: number;
    senderId: string;
    action?: 'spin' | 'confirm' | 'cancel';
    winnerIds?: string[];
    winnerRecordIds?: string[];
  } | null;
}

const DEFAULT_STATE: AppState = {
  employees: [
    { id: 'emp_1', name: 'Nguyễn Insight', email: 'insight.n@bidv.com.vn', department: 'Phân tích KH' },
    { id: 'emp_2', name: 'Trần BigData', email: 'data.t@bidv.com.vn', department: 'Kỹ thuật Dữ liệu' },
    { id: 'emp_3', name: 'Lê AI', email: 'ai.l@bidv.com.vn', department: 'Mô hình hóa' },
    { id: 'emp_4', name: 'Phạm Dashboard', email: 'dash.p@bidv.com.vn', department: 'Quản trị Dữ liệu' },
    { id: 'emp_5', name: 'Hoàng Machine Learning', email: 'ml.h@bidv.com.vn', department: 'Kỹ thuật AI' },
    { id: 'emp_6', name: 'Đỗ Analytics', email: 'analytics.d@bidv.com.vn', department: 'Phân tích Kinh doanh' },
    { id: 'emp_7', name: 'Vũ Cloud', email: 'cloud.v@bidv.com.vn', department: 'Hạ tầng Dữ liệu' },
    { id: 'emp_8', name: 'Bùi Data Engineer', email: 'de.b@bidv.com.vn', department: 'Kỹ thuật Dữ liệu' },
    { id: 'emp_9', name: 'Đặng Statistics', email: 'stat.d@bidv.com.vn', department: 'Thống kê' },
    { id: 'emp_10', name: 'Trịnh Python', email: 'py.t@bidv.com.vn', department: 'Phát triển Mô hình' }
  ],
  prizes: [
    { id: 'prz_1', name: 'GIẢI BIG DATA (Xe máy Vision)', originalQuantity: 1, quantity: 1 },
    { id: 'prz_2', name: 'GIẢI INSIGHT (iPhone 15 Pro)', originalQuantity: 2, quantity: 2 },
    { id: 'prz_3', name: 'GIẢI ANALYTICS (Máy tính bảng Samsung)', originalQuantity: 3, quantity: 3 },
    { id: 'prz_4', name: 'GIẢI DATA DRIVEN (Voucher 2tr)', originalQuantity: 5, quantity: 5 },
    { id: 'prz_5', name: 'GIẢI KẾT NỐI (Quà lưu niệm D&A)', originalQuantity: 10, quantity: 10 }
  ],
  winners: [],
  settings: {
    soundEnabled: true,
    demoMode: false,
    confettiEnabled: true,
    enableTease: false
  },
  adminPin: 'hannn2',
  mcPin: 'hannn13',
  riggedSettings: [],
  activePrizeId: undefined,
  activeSpinCount: undefined,
  spinTrigger: null
};

let currentState: AppState = DEFAULT_STATE;

// Load initial state if db.json exists
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    currentState = { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error reading db.json, using defaults:', err);
  }
} else {
  saveDb(DEFAULT_STATE);
}

function saveDb(data: AppState) {
  try {
    const dataToSave = { ...data, spinTrigger: null };
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

const sseClients = new Set<express.Response>();

function broadcastStateUpdate(partialData: Partial<AppState>) {
  currentState = { ...currentState, ...partialData };
  saveDb(currentState);

  const payload = JSON.stringify(partialData);
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// API Endpoints
app.get('/api/data', (_req, res) => {
  res.json(currentState);
});

app.post('/api/data/employees', (req, res) => {
  const { employees } = req.body;
  if (Array.isArray(employees)) {
    broadcastStateUpdate({ employees });
  }
  res.json({ success: true });
});

app.post('/api/data/prizes', (req, res) => {
  const { prizes } = req.body;
  if (Array.isArray(prizes)) {
    broadcastStateUpdate({ prizes });
  }
  res.json({ success: true });
});

app.post('/api/data/prize-quantity', (req, res) => {
  const { prizeId, quantity } = req.body;
  const updatedPrizes = currentState.prizes.map((p) =>
    p.id === prizeId ? { ...p, quantity } : p
  );
  broadcastStateUpdate({ prizes: updatedPrizes });
  res.json({ success: true });
});

app.post('/api/data/winners/add', (req, res) => {
  const { winners } = req.body;
  if (Array.isArray(winners)) {
    const existingMap = new Map(currentState.winners.map(w => [w.id, w]));
    winners.forEach(w => existingMap.set(w.id, w));
    broadcastStateUpdate({ winners: Array.from(existingMap.values()) });
  }
  res.json({ success: true });
});

app.post('/api/data/winners/remove', (req, res) => {
  const { winIds } = req.body;
  if (Array.isArray(winIds)) {
    const idsSet = new Set(winIds);
    const filtered = currentState.winners.filter(w => !idsSet.has(w.id));
    broadcastStateUpdate({ winners: filtered });
  }
  res.json({ success: true });
});

app.post('/api/data/winners/clear', (_req, res) => {
  broadcastStateUpdate({ winners: [] });
  res.json({ success: true });
});

app.post('/api/data/config', (req, res) => {
  const { settings, adminPin, mcPin, riggedSettings } = req.body;
  const update: Partial<AppState> = {};
  if (settings !== undefined) update.settings = settings;
  if (adminPin !== undefined) update.adminPin = adminPin;
  if (mcPin !== undefined) update.mcPin = mcPin;
  if (riggedSettings !== undefined) update.riggedSettings = riggedSettings;

  broadcastStateUpdate(update);
  res.json({ success: true });
});

app.post('/api/data/active-prize', (req, res) => {
  const { activePrizeId, activeSpinCount } = req.body;
  broadcastStateUpdate({ activePrizeId, activeSpinCount });
  res.json({ success: true });
});

app.post('/api/data/spin-trigger', (req, res) => {
  const { prizeId, quantity, senderId, action, winnerIds, winnerRecordIds, spinDuration } = req.body;
  const spinTrigger = {
    prizeId,
    quantity,
    timestamp: Date.now(),
    senderId,
    action: action || 'spin',
    winnerIds,
    winnerRecordIds,
    spinDuration
  };
  broadcastStateUpdate({ spinTrigger });
  res.json({ success: true });
});

// Realtime SSE endpoint
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send current state immediately upon connection
  res.write(`data: ${JSON.stringify(currentState)}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
