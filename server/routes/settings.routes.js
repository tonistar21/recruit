import {Router} from 'express';
import {query, withTransaction} from '../db.js';
import {writeLog} from '../services/log.service.js';

const router = Router();

async function loadSettings() {
  const result = await query('SELECT setting_key, setting_value FROM system_settings ORDER BY id_setting');
  const settings = {};
  for (const row of result.rows) {
    if (row.setting_key === 'twoFactor') {
      settings[row.setting_key] = row.setting_value === 'true';
    } else {
      settings[row.setting_key] = row.setting_value;
    }
  }
  return settings;
}

router.get('/', async (_req, res, next) => {
  try {
    res.json(await loadSettings());
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req, res, next) => {
  try {
    await withTransaction(async (client) => {
      for (const [key, value] of Object.entries(req.body)) {
        await client.query(
          `INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
           VALUES ($1, $2, (SELECT id_user FROM users WHERE email = $3 LIMIT 1), CURRENT_TIMESTAMP)
           ON CONFLICT (setting_key)
           DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_by = EXCLUDED.updated_by, updated_at = CURRENT_TIMESTAMP`,
          [key, String(value), req.auth.userEmail || null],
        );
      }
    });

    await writeLog({
      req,
      action: 'Оновлення налаштувань',
      objectType: 'settings',
      objectId: 'system',
      newValue: req.body,
    });

    res.json(await loadSettings());
  } catch (error) {
    next(error);
  }
});

export default router;
