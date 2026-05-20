import {Router} from 'express';
import {query} from '../db.js';

const router = Router();

router.get('/dashboard', async (_req, res, next) => {
  try {
    const totalRes = await query('SELECT COUNT(*)::int AS count FROM candidates WHERE is_archived = FALSE');
    const interviewRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM candidates c
       JOIN candidate_status s ON s.id_status = c.current_status_id
       WHERE c.is_archived = FALSE AND s.status_name = 'Співбесіда'`,
    );
    const recommendedRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM candidates c
       JOIN candidate_status s ON s.id_status = c.current_status_id
       WHERE c.is_archived = FALSE AND s.status_name = 'Рекомендовано'`,
    );
    const weeklyRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM candidates
       WHERE is_archived = FALSE AND registration_date >= CURRENT_TIMESTAMP - INTERVAL '7 days'`,
    );

    res.json({
      totalCandidates: totalRes.rows[0].count,
      onInterview: interviewRes.rows[0].count,
      recommended: recommendedRes.rows[0].count,
      newWeekly: weeklyRes.rows[0].count,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status-distribution', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT s.status_name, COUNT(*)::int AS count
       FROM candidates c
       JOIN candidate_status s ON s.id_status = c.current_status_id
       WHERE c.is_archived = FALSE
       GROUP BY s.status_name
       ORDER BY s.status_name`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/registration-dynamics', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT TO_CHAR(day, 'Dy') AS label, COALESCE(cnt, 0)::int AS value
       FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS day
       LEFT JOIN (
         SELECT DATE(registration_date) AS reg_date, COUNT(*) AS cnt
         FROM candidates
         GROUP BY DATE(registration_date)
       ) source ON source.reg_date = DATE(day)
       ORDER BY day`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/recruiters', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT COALESCE(u.full_name, 'Не призначено') AS recruiter_name, COUNT(*)::int AS count
       FROM candidates c
       LEFT JOIN users u ON u.id_user = c.recruiter_id
       WHERE c.is_archived = FALSE
       GROUP BY COALESCE(u.full_name, 'Не призначено')
       ORDER BY count DESC, recruiter_name`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
