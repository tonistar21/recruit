import {Router} from 'express';
import {query, withTransaction} from '../db.js';
import {writeLog} from '../services/log.service.js';

const router = Router();

async function buildMatrix() {
  const rolesRes = await query('SELECT id_role, role_name FROM roles ORDER BY id_role');
  const permsRes = await query('SELECT id_permission, permission_name, permission_code FROM permissions ORDER BY id_permission');
  const rpRes = await query('SELECT id_role, id_permission FROM role_permissions');

  const matrix = {};
  for (const perm of permsRes.rows) {
    matrix[perm.permission_name] = {};
    for (const role of rolesRes.rows) {
      matrix[perm.permission_name][role.role_name] = false;
    }
  }

  for (const rp of rpRes.rows) {
    const role = rolesRes.rows.find((item) => item.id_role === rp.id_role);
    const perm = permsRes.rows.find((item) => item.id_permission === rp.id_permission);
    if (role && perm) {
      matrix[perm.permission_name][role.role_name] = true;
    }
  }

  return matrix;
}

router.get('/', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM roles ORDER BY id_role');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/permissions', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM permissions ORDER BY id_permission');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/matrix', async (_req, res, next) => {
  try {
    res.json(await buildMatrix());
  } catch (error) {
    next(error);
  }
});

router.put('/:id/permissions', async (req, res, next) => {
  try {
    const roleIdOrName = req.params.id;
    const {permissionName, allowed} = req.body;

    await withTransaction(async (client) => {
      const roleRes = await client.query(
        `SELECT id_role FROM roles
         WHERE CAST(id_role AS TEXT) = $1 OR role_name = $1`,
        [roleIdOrName],
      );
      const permRes = await client.query(
        'SELECT id_permission FROM permissions WHERE permission_name = $1',
        [permissionName],
      );

      const roleId = roleRes.rows[0]?.id_role;
      const permId = permRes.rows[0]?.id_permission;
      if (!roleId || !permId) {
        throw new Error('Role or permission not found');
      }

      if (allowed) {
        await client.query(
          'INSERT INTO role_permissions (id_role, id_permission) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [roleId, permId],
        );
      } else {
        await client.query(
          'DELETE FROM role_permissions WHERE id_role = $1 AND id_permission = $2',
          [roleId, permId],
        );
      }
    });

    await writeLog({
      req,
      action: 'Зміна ролей і дозволів',
      objectType: 'role_permissions',
      objectId: roleIdOrName,
      newValue: {permissionName, allowed},
    });

    res.json(await buildMatrix());
  } catch (error) {
    next(error);
  }
});

export default router;
