import {query} from '../db.js';

async function resolveActor(auth = {}) {
  if (auth.userId) {
    const byId = await query(
      'SELECT id_user, full_name FROM users WHERE id_user = $1',
      [auth.userId],
    );
    if (byId.rows[0]) {
      return byId.rows[0];
    }
  }

  if (auth.userEmail) {
    const byEmail = await query(
      'SELECT id_user, full_name FROM users WHERE email = $1',
      [auth.userEmail],
    );
    if (byEmail.rows[0]) {
      return byEmail.rows[0];
    }
  }

  if (auth.userName) {
    const byName = await query(
      'SELECT id_user, full_name FROM users WHERE full_name = $1',
      [auth.userName],
    );
    if (byName.rows[0]) {
      return byName.rows[0];
    }
  }

  return null;
}

export async function writeLog({
  req,
  action,
  objectType = null,
  objectId = null,
  oldValue = null,
  newValue = null,
  result = 'SUCCESS',
}) {
  const actor = await resolveActor(req?.auth || {});
  const userName = actor?.full_name || req?.auth?.userName || 'Системний процес';

  await query(
    `INSERT INTO logs (
      user_id, user_name, action, object_type, object_id,
      old_value, new_value, result, ip_address, user_agent
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      actor?.id_user || null,
      userName,
      action,
      objectType,
      objectId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      result,
      req?.ip || null,
      req?.headers['user-agent'] || null,
    ],
  );
}
