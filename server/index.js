import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {checkConnection, runMigrations} from './db.js';
import {authContext} from './middleware/auth.js';
import analyticsRoutes from './routes/analytics.routes.js';
import candidatesRoutes from './routes/candidates.routes.js';
import documentsRoutes from './routes/documents.routes.js';
import logsRoutes from './routes/logs.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import usersRoutes from './routes/users.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 8000);
const uploadsDir = path.resolve(__dirname, process.env.UPLOAD_DIR || 'uploads');

app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));
app.use(authContext);
app.use('/uploads', express.static(uploadsDir));

app.get('/health', async (_req, res) => {
  try {
    await checkConnection();
    res.json({status: 'ok', database: 'connected'});
  } catch (_error) {
    res.status(500).json({status: 'error', database: 'disconnected'});
  }
});

app.use('/api/candidates', candidatesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.get('/api/permissions', (_req, res) => res.redirect(307, '/api/roles/permissions'));
app.use('/api/logs', logsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({message: error.message || 'Internal server error'});
});

async function start() {
  await fs.mkdir(uploadsDir, {recursive: true});
  await checkConnection();
  await runMigrations();
  app.listen(port, () => {
    console.log(`Recruit+ API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
