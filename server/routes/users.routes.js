import bcrypt from 'bcryptjs';
import {Router} from 'express';
import {query} from '../db.js';
import {writeLog} from '../services/log.service.js';

const router = Router();

function formatDateTime(value) {
  if (!value) return 'Немає входів';
  return new Date(value).toISOString().replace('T', ' ').slice(0, 16);
}

function mapUser(row) {
  return {
    id: `U-${row.id_user}`,
    name: row.full_name,
    email: row.email,
    role: row.role_name,
    status: row.status,
    lastLogin: formatDateTime(row.last_login),
    department: row.department,
    username: row.username,
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT u.*, r.role_name
       FROM users u
       LEFT JOIN roles r ON r.id_role = u.role_id
       ORDER BY u.id_user`,
    );
    res.json(result.rows.map(mapUser));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const username = req.body.username || req.body.email.split('@')[0];
    const password = req.body.password || 'ChangeMe123!';
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (role_id, full_name, email, username, password_hash, status, department)
       VALUES (
        (SELECT id_role FROM roles WHERE role_name = $1),
        $2, $3, $4, $5, COALESCE($6, 'Активний'), $7
       )
       RETURNING id_user`,
      [
        req.body.role,
        req.body.name,
        req.body.email,
        username,
        passwordHash,
        req.body.status || 'Активний',
        req.body.department || null,
      ],
    );

    const created = await query(
      `SELECT u.*, r.role_name
       FROM users u
       LEFT JOIN roles r ON r.id_role = u.role_id
       WHERE u.id_user = $1`,
      [result.rows[0].id_user],
    );

    await writeLog({
      req,
      action: 'Створення користувача',
      objectType: 'user',
      objectId: `U-${result.rows[0].id_user}`,
      newValue: mapUser(created.rows[0]),
    });

    res.status(201).json(mapUser(created.rows[0]));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const numericId = Number(String(req.params.id).replace('U-', ''));
    await query(
      `UPDATE users
       SET role_id = (SELECT id_role FROM roles WHERE role_name = $2),
           full_name = $3,
           email = $4,
           department = $5,
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id_user = $1`,
      [
        numericId,
        req.body.role,
        req.body.name,
        req.body.email,
        req.body.department || null,
        req.body.status || null,
      ],
    );

    const updated = await query(
      `SELECT u.*, r.role_name
       FROM users u
       LEFT JOIN roles r ON r.id_role = u.role_id
       WHERE u.id_user = $1`,
      [numericId],
    );

    await writeLog({
      req,
      action: 'Редагування користувача',
      objectType: 'user',
      objectId: `U-${numericId}`,
      newValue: mapUser(updated.rows[0]),
    });

    res.json(mapUser(updated.rows[0]));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/deactivate', async (req, res, next) => {
  try {
    const numericId = Number(String(req.params.id).replace('U-', ''));
    const status = req.body.status || 'Деактивований';
    await query(
      'UPDATE users SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id_user = $1',
      [numericId, status],
    );

    await writeLog({
      req,
      action: 'Зміна статусу користувача',
      objectType: 'user',
      objectId: `U-${numericId}`,
      newValue: {status},
    });

    res.json({success: true});
  } catch (error) {
    next(error);
  }
});

export default router;
