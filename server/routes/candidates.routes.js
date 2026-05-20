import {Router} from 'express';
import {query, withTransaction} from '../db.js';
import {writeLog} from '../services/log.service.js';

const router = Router();

function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toISOString().replace('T', ' ').slice(0, 19);
}

function mapStatusToFrontend(status) {
  if (status === 'Перевірка документів') return 'Перевірка док.';
  if (status === 'Архівовано') return 'Архів';
  return status;
}

function mapStatusToDatabase(status) {
  if (status === 'Перевірка док.') return 'Перевірка документів';
  if (status === 'Архів') return 'Архівовано';
  return status;
}

function deriveStatusFromStage(stage) {
  const mapping = {
    'Первинна реєстрація': 'Новий',
    'Перевірка документів': 'Перевірка документів',
    'Співбесіда з рекрутером': 'Співбесіда',
    'Співбесіда з психологом': 'Співбесіда',
    'Професійне тестування': 'Тестування',
    'Медична перевірка': 'Тестування',
    'Очікування рішення': 'Співбесіда',
    'Рекомендовано': 'Рекомендовано',
    'Очікування наказу': 'Рекомендовано',
    'Зараховано': 'Зараховано',
    'Відхилено': 'Відхилено',
  };
  return mapping[stage] || 'Новий';
}

async function loadCandidates(publicId = null) {
  const params = [];
  let whereSql = 'WHERE c.is_archived = FALSE';
  if (publicId) {
    params.push(publicId);
    whereSql += ` AND c.public_id = $${params.length}`;
  }

  const candidatesResult = await query(
    `SELECT
      c.id_candidate,
      c.public_id,
      c.last_name,
      c.first_name,
      c.middle_name,
      TO_CHAR(c.birth_date, 'YYYY-MM-DD') AS birth_date,
      c.gender,
      c.ipn,
      c.phone,
      c.email,
      c.region,
      c.city,
      c.address,
      c.education_level,
      c.institution,
      c.speciality,
      c.work_experience,
      c.military_experience,
      c.desired_unit,
      c.registration_date,
      c.updated_at,
      c.archived_at,
      s.status_name,
      st.stage_name,
      u.full_name AS recruiter_name
    FROM candidates c
    LEFT JOIN candidate_status s ON s.id_status = c.current_status_id
    LEFT JOIN selection_stages st ON st.id_stage = c.current_stage_id
    LEFT JOIN users u ON u.id_user = c.recruiter_id
    ${whereSql}
    ORDER BY c.public_id`,
    params,
  );

  const candidateIds = candidatesResult.rows.map((row) => row.id_candidate);
  const documentsByCandidate = new Map();
  const historyByCandidate = new Map();

  if (candidateIds.length > 0) {
    const docsResult = await query(
      `SELECT
        cd.id_document,
        cd.candidate_id,
        dt.type_name,
        cd.file_name,
        cd.original_file_name,
        cd.status,
        cd.uploaded_at,
        u.full_name AS uploaded_by_name
      FROM candidate_documents cd
      LEFT JOIN document_types dt ON dt.id_document_type = cd.document_type_id
      LEFT JOIN users u ON u.id_user = cd.uploaded_by
      WHERE cd.candidate_id = ANY($1::int[])
      ORDER BY cd.uploaded_at`,
      [candidateIds],
    );

    for (const doc of docsResult.rows) {
      if (!documentsByCandidate.has(doc.candidate_id)) {
        documentsByCandidate.set(doc.candidate_id, []);
      }
      documentsByCandidate.get(doc.candidate_id).push({
        id: `D-${doc.id_document}`,
        type: doc.type_name || 'Інші документи',
        fileName: doc.original_file_name || doc.file_name,
        uploadDate: formatDate(doc.uploaded_at),
        uploadedBy: doc.uploaded_by_name || 'Системний процес',
        status: doc.status,
      });
    }

    const historyResult = await query(
      `SELECT
        h.candidate_id,
        h.changed_at,
        h.comment,
        COALESCE(u.full_name, 'Системний процес') AS user_name
      FROM candidate_stage_history h
      LEFT JOIN users u ON u.id_user = h.changed_by
      WHERE h.candidate_id = ANY($1::int[])
      ORDER BY h.changed_at DESC`,
      [candidateIds],
    );

    for (const item of historyResult.rows) {
      if (!historyByCandidate.has(item.candidate_id)) {
        historyByCandidate.set(item.candidate_id, []);
      }
      historyByCandidate.get(item.candidate_id).push({
        datetime: formatDateTime(item.changed_at),
        user: item.user_name,
        comment: item.comment || '',
      });
    }
  }

  return candidatesResult.rows.map((row) => ({
    id: row.public_id,
    lastName: row.last_name,
    firstName: row.first_name,
    middleName: row.middle_name || '',
    fullName: [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(' '),
    birthDate: row.birth_date,
    gender: row.gender,
    ipn: row.ipn,
    phone: row.phone,
    email: row.email,
    region: row.region,
    city: row.city,
    address: row.address,
    educationLevel: row.education_level,
    institution: row.institution,
    speciality: row.speciality,
    workExperience: row.work_experience,
    militaryExperience: row.military_experience,
    desiredUnit: row.desired_unit,
    status: mapStatusToFrontend(row.status_name),
    stage: row.stage_name,
    createdAt: row.registration_date,
    updatedAt: row.updated_at,
    recruiterName: row.recruiter_name,
    documents: documentsByCandidate.get(row.id_candidate) || [],
    history: historyByCandidate.get(row.id_candidate) || [],
  }));
}

async function getCandidateInternal(publicId) {
  const candidates = await loadCandidates(publicId);
  return candidates[0] || null;
}

router.get('/', async (_req, res, next) => {
  try {
    res.json(await loadCandidates());
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const candidate = await getCandidateInternal(req.params.id);
    if (!candidate) {
      return res.status(404).json({message: 'Candidate not found'});
    }
    res.json(candidate);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const createdPublicId = await withTransaction(async (client) => {
      const lastIdResult = await client.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(public_id FROM 3) AS INT)), 1023) AS max_id
         FROM candidates`,
      );
      const nextNumber = Number(lastIdResult.rows[0].max_id) + 1;
      const publicId = `C-${nextNumber}`;

      const statusIdResult = await client.query(
        `SELECT id_status FROM candidate_status WHERE status_name = 'Новий'`,
      );
      const stageIdResult = await client.query(
        `SELECT id_stage FROM selection_stages WHERE stage_name = 'Первинна реєстрація'`,
      );
      const recruiterResult = await client.query(
        `SELECT id_user FROM users WHERE username = 'recruiter' LIMIT 1`,
      );

      const payload = req.body;
      const inserted = await client.query(
        `INSERT INTO candidates (
          public_id, last_name, first_name, middle_name, birth_date, gender, ipn, phone, email,
          region, city, address, education_level, institution, speciality, work_experience,
          military_experience, desired_unit, current_status_id, current_stage_id, recruiter_id
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
        ) RETURNING id_candidate`,
        [
          publicId,
          payload.lastName,
          payload.firstName,
          payload.middleName || null,
          payload.birthDate || null,
          payload.gender || null,
          payload.ipn || null,
          payload.phone || null,
          payload.email || null,
          payload.region || null,
          payload.city || null,
          payload.address || null,
          payload.educationLevel || null,
          payload.institution || null,
          payload.speciality || null,
          payload.workExperience || null,
          payload.militaryExperience || null,
          payload.desiredUnit || null,
          statusIdResult.rows[0]?.id_status || null,
          stageIdResult.rows[0]?.id_stage || null,
          recruiterResult.rows[0]?.id_user || null,
        ],
      );

      const candidateId = inserted.rows[0].id_candidate;
      await client.query(
        `INSERT INTO candidate_stage_history (candidate_id, stage_id, status_id, changed_by, comment)
         VALUES ($1,$2,$3,(SELECT id_user FROM users WHERE email = $4 LIMIT 1),$5)`,
        [
          candidateId,
          stageIdResult.rows[0]?.id_stage || null,
          statusIdResult.rows[0]?.id_status || null,
          req.auth.userEmail || null,
          'Первинна реєстрація нового кандидата в системі.',
        ],
      );

      if (Array.isArray(payload.documents)) {
        for (const doc of payload.documents) {
          const docTypeResult = await client.query(
            `SELECT id_document_type FROM document_types WHERE type_name = $1 LIMIT 1`,
            [doc.type || 'Інші документи'],
          );
          await client.query(
            `INSERT INTO candidate_documents (
              candidate_id, document_type_id, file_name, original_file_name, status, uploaded_by
            ) VALUES ($1,$2,$3,$4,$5,(SELECT id_user FROM users WHERE email = $6 LIMIT 1))`,
            [
              candidateId,
              docTypeResult.rows[0]?.id_document_type || null,
              doc.fileName,
              doc.fileName,
              'Очікує перевірки',
              req.auth.userEmail || null,
            ],
          );
        }
      }

      return publicId;
    });

    const candidate = await getCandidateInternal(createdPublicId);
    await writeLog({
      req,
      action: 'Створення кандидата',
      objectType: 'candidate',
      objectId: createdPublicId,
      newValue: candidate,
    });
    res.status(201).json(candidate);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const before = await getCandidateInternal(req.params.id);
    if (!before) {
      return res.status(404).json({message: 'Candidate not found'});
    }

    await query(
      `UPDATE candidates SET
        last_name = $2,
        first_name = $3,
        middle_name = $4,
        birth_date = $5,
        gender = $6,
        ipn = $7,
        phone = $8,
        email = $9,
        region = $10,
        city = $11,
        address = $12,
        education_level = $13,
        institution = $14,
        speciality = $15,
        work_experience = $16,
        military_experience = $17,
        desired_unit = $18,
        updated_at = CURRENT_TIMESTAMP
      WHERE public_id = $1`,
      [
        req.params.id,
        req.body.lastName,
        req.body.firstName,
        req.body.middleName || null,
        req.body.birthDate || null,
        req.body.gender || null,
        req.body.ipn || null,
        req.body.phone || null,
        req.body.email || null,
        req.body.region || null,
        req.body.city || null,
        req.body.address || null,
        req.body.educationLevel || null,
        req.body.institution || null,
        req.body.speciality || null,
        req.body.workExperience || null,
        req.body.militaryExperience || null,
        req.body.desiredUnit || null,
      ],
    );

    const after = await getCandidateInternal(req.params.id);
    await writeLog({
      req,
      action: 'Редагування кандидата',
      objectType: 'candidate',
      objectId: req.params.id,
      oldValue: before,
      newValue: after,
    });
    res.json(after);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const statusName = mapStatusToDatabase(req.body.status);
    const before = await getCandidateInternal(req.params.id);
    if (!before) {
      return res.status(404).json({message: 'Candidate not found'});
    }

    await query(
      `UPDATE candidates
       SET current_status_id = (SELECT id_status FROM candidate_status WHERE status_name = $2),
           updated_at = CURRENT_TIMESTAMP
       WHERE public_id = $1`,
      [req.params.id, statusName],
    );

    const after = await getCandidateInternal(req.params.id);
    await writeLog({
      req,
      action: 'Зміна статусу кандидата',
      objectType: 'candidate',
      objectId: req.params.id,
      oldValue: {status: before.status},
      newValue: {status: after?.status},
    });
    res.json(after);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/stage', async (req, res, next) => {
  try {
    const before = await getCandidateInternal(req.params.id);
    if (!before) {
      return res.status(404).json({message: 'Candidate not found'});
    }

    const stageName = req.body.stage;
    const statusName = deriveStatusFromStage(stageName);

    await withTransaction(async (client) => {
      const stageRes = await client.query(
        'SELECT id_stage FROM selection_stages WHERE stage_name = $1',
        [stageName],
      );
      const statusRes = await client.query(
        'SELECT id_status FROM candidate_status WHERE status_name = $1',
        [statusName],
      );

      await client.query(
        `UPDATE candidates
         SET current_stage_id = $2,
             current_status_id = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE public_id = $1`,
        [req.params.id, stageRes.rows[0]?.id_stage || null, statusRes.rows[0]?.id_status || null],
      );

      await client.query(
        `INSERT INTO candidate_stage_history (candidate_id, stage_id, status_id, changed_by, comment)
         VALUES (
           (SELECT id_candidate FROM candidates WHERE public_id = $1),
           $2,
           $3,
           (SELECT id_user FROM users WHERE email = $4 LIMIT 1),
           $5
         )`,
        [
          req.params.id,
          stageRes.rows[0]?.id_stage || null,
          statusRes.rows[0]?.id_status || null,
          req.auth.userEmail || null,
          `Зміна етапу відбору на "${stageName}".`,
        ],
      );
    });

    const after = await getCandidateInternal(req.params.id);
    await writeLog({
      req,
      action: 'Зміна етапу кандидата',
      objectType: 'candidate',
      objectId: req.params.id,
      oldValue: {stage: before.stage, status: before.status},
      newValue: {stage: after?.stage, status: after?.status},
    });
    res.json(after);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/archive', async (req, res, next) => {
  try {
    const before = await getCandidateInternal(req.params.id);
    if (!before) {
      return res.status(404).json({message: 'Candidate not found'});
    }

    await query(
      `UPDATE candidates
       SET is_archived = TRUE,
           archived_at = CURRENT_TIMESTAMP,
           current_status_id = (SELECT id_status FROM candidate_status WHERE status_name = 'Архівовано'),
           updated_at = CURRENT_TIMESTAMP
       WHERE public_id = $1`,
      [req.params.id],
    );

    await writeLog({
      req,
      action: 'Архівування кандидата',
      objectType: 'candidate',
      objectId: req.params.id,
      oldValue: before,
      newValue: {archived: true},
    });
    res.json({success: true});
  } catch (error) {
    next(error);
  }
});

export default router;
