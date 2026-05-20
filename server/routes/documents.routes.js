import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Router} from 'express';
import multer from 'multer';
import {query} from '../db.js';
import {writeLog} from '../services/log.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, safeName);
  },
});

const upload = multer({storage});
const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
        cd.id_document,
        c.public_id AS candidate_public_id,
        c.last_name,
        c.first_name,
        c.middle_name,
        dt.type_name,
        cd.file_name,
        cd.original_file_name,
        cd.status,
        TO_CHAR(cd.uploaded_at::date, 'YYYY-MM-DD') AS uploaded_date,
        u.full_name AS uploaded_by_name
      FROM candidate_documents cd
      JOIN candidates c ON c.id_candidate = cd.candidate_id
      LEFT JOIN document_types dt ON dt.id_document_type = cd.document_type_id
      LEFT JOIN users u ON u.id_user = cd.uploaded_by
      ORDER BY cd.uploaded_at DESC`,
    );

    res.json(
      result.rows.map((row) => ({
        id: `D-${row.id_document}`,
        candidateId: row.candidate_public_id,
        candidateName: [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(' '),
        type: row.type_name || 'Інші документи',
        fileName: row.original_file_name || row.file_name,
        uploadDate: row.uploaded_date,
        uploadedBy: row.uploaded_by_name || 'Системний процес',
        status: row.status,
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const candidatePublicId = req.body.candidateId;
    const documentTypeName = req.body.documentType || 'Інші документи';
    const status = req.body.status || 'Очікує перевірки';

    const inserted = await query(
      `INSERT INTO candidate_documents (
        candidate_id, document_type_id, file_name, original_file_name, file_path,
        mime_type, file_size, status, uploaded_by
      )
      VALUES (
        (SELECT id_candidate FROM candidates WHERE public_id = $1),
        (SELECT id_document_type FROM document_types WHERE type_name = $2),
        $3, $4, $5, $6, $7, $8,
        (SELECT id_user FROM users WHERE email = $9 LIMIT 1)
      )
      RETURNING id_document`,
      [
        candidatePublicId,
        documentTypeName,
        req.file?.filename || req.body.fileName,
        req.file?.originalname || req.body.fileName,
        req.file ? `uploads/${req.file.filename}` : null,
        req.file?.mimetype || null,
        req.file?.size || null,
        status,
        req.auth.userEmail || null,
      ],
    );

    await writeLog({
      req,
      action: 'Завантаження документа',
      objectType: 'document',
      objectId: `D-${inserted.rows[0].id_document}`,
      newValue: {candidateId: candidatePublicId, documentType: documentTypeName},
    });

    res.status(201).json({success: true, id: `D-${inserted.rows[0].id_document}`});
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const numericId = Number(String(req.params.id).replace('D-', ''));
    await query(
      `UPDATE candidate_documents
       SET status = $2,
           verified_by = (SELECT id_user FROM users WHERE email = $3 LIMIT 1),
           verified_at = CURRENT_TIMESTAMP
       WHERE id_document = $1`,
      [numericId, req.body.status, req.auth.userEmail || null],
    );

    await writeLog({
      req,
      action: 'Зміна статусу документа',
      objectType: 'document',
      objectId: `D-${numericId}`,
      newValue: {status: req.body.status},
    });

    res.json({success: true});
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const numericId = Number(String(req.params.id).replace('D-', ''));
    const existing = await query(
      'SELECT file_path FROM candidate_documents WHERE id_document = $1',
      [numericId],
    );

    await query('DELETE FROM candidate_documents WHERE id_document = $1', [numericId]);

    const filePath = existing.rows[0]?.file_path;
    if (filePath) {
      const absolutePath = path.resolve(__dirname, '..', '..', filePath);
      await fs.rm(absolutePath, {force: true});
    }

    await writeLog({
      req,
      action: 'Видалення документа',
      objectType: 'document',
      objectId: `D-${numericId}`,
    });

    res.json({success: true});
  } catch (error) {
    next(error);
  }
});

export default router;
