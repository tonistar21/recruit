import {Router} from 'express';
import {query} from '../db.js';
import {writeLog} from '../services/log.service.js';

const router = Router();

function mapLog(row) {
  return {
    id: `L-${row.id_log}`,
    datetime: new Date(row.log_time).toISOString().replace('T', ' ').slice(0, 19),
    user: row.user_name || 'Системний процес',
    action: row.action,
    object: row.object_type && row.object_id ? `${row.object_type} ${row.object_id}` : (row.object_id || row.object_type || ''),
    result: row.result === 'SUCCESS' ? 'УСПІХ' : row.result,
    ip: row.ip_address || '',
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM logs ORDER BY log_time DESC');
    res.json(result.rows.map(mapLog));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    await writeLog({
      req,
      action: req.body.action,
      objectType: req.body.objectType || null,
      objectId: req.body.objectId || null,
      oldValue: req.body.oldValue || null,
      newValue: req.body.newValue || null,
      result: req.body.result || 'SUCCESS',
    });
    res.status(201).json({success: true});
  } catch (error) {
    next(error);
  }
});

router.get('/export', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM logs ORDER BY log_time DESC');
    const rows = result.rows.map(mapLog);
    const lines = [
      'Дата;Користувач;Дія;Об`єкт;Результат;IP',
      ...rows.map((row) => `${row.datetime};${row.user};${row.action};${row.object};${row.result};${row.ip}`),
    ];

    await writeLog({
      req,
      action: 'Експорт логів',
      objectType: 'logs',
      objectId: 'export',
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="recruit_logs.txt"`);
    res.send(lines.join('\n'));
  } catch (error) {
    next(error);
  }
});

export default router;
