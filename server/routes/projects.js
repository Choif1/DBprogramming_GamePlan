import express from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.join(__dirname, '../uploads');
const allowedImageTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const allowedFeedbackSections = ['overview', 'gameplay', 'gamesystem', 'story', 'features'];

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${allowedImageTypes[file.mimetype] || ''}`);
    },
  }),
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes[file.mimetype]) {
      callback(new Error('JPG, PNG, WEBP, GIF 이미지 파일만 업로드할 수 있습니다.'));
      return;
    }
    callback(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const removeUploadedFile = async (file) => {
  if (!file) return;
  try {
    await unlink(file.path);
  } catch {
    // 파일 정리 실패가 API 응답을 덮지 않도록 무시
  }
};

// 로그인한 사용자의 기획서 생성
// POST /api/projects
router.post('/', authenticateToken, (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? '이미지는 5MB 이하로 업로드해 주세요.'
      : error.message || '이미지 업로드에 실패했습니다.';
    return res.status(400).json({ message });
  });
}, async (req, res) => {
  const fields = ['title', 'genre', 'overview', 'gameplay', 'gamesystem', 'story', 'features'];
  const project = Object.fromEntries(fields.map((field) => [field, String(req.body[field] || '').trim()]));

  if (fields.some((field) => !project[field])) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: '모든 기획서 항목을 입력해 주세요.' });
  }
  if (project.title.length > 100 || project.genre.length > 50) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: '제목은 100자, 장르는 50자 이내로 입력해 주세요.' });
  }

  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [result] = await db.query(`
      INSERT INTO projects (
        user_id, title, genre, image, overview, gameplay, gamesystem, story, features
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      project.title,
      project.genre,
      image,
      project.overview,
      project.gameplay,
      project.gamesystem,
      project.story,
      project.features,
    ]);

    return res.status(201).json({
      message: '기획서가 등록되었습니다.',
      projectId: result.insertId,
    });
  } catch (error) {
    await removeUploadedFile(req.file);
    console.error('기획서 생성 오류:', error.message);
    return res.status(500).json({ message: '기획서를 저장하지 못했습니다.' });
  }
});

// 공개 기획서 목록과 작성자 정보를 함께 조회
// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const [projects] = await db.query(`
      SELECT
        p.id,
        p.title,
        p.genre,
        p.image,
        p.overview,
        p.created_at,
        u.nickname AS author
      FROM projects AS p
      JOIN users AS u ON u.id = p.user_id
      ORDER BY p.created_at DESC, p.id DESC
    `);

    res.json(projects);
  } catch (error) {
    console.error('기획서 목록 조회 오류:', error.message);
    res.status(500).json({ message: '기획서 목록을 불러오지 못했습니다.' });
  }
});

// 로그인 사용자가 작성한 기획서 목록
// GET /api/projects/my
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const [projects] = await db.query(`
      SELECT
        p.id,
        p.user_id,
        p.title,
        p.genre,
        p.image,
        p.overview,
        p.created_at,
        p.updated_at,
        u.nickname AS author
      FROM projects AS p
      JOIN users AS u ON u.id = p.user_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC, p.id DESC
    `, [req.user.id]);

    return res.json(projects);
  } catch (error) {
    console.error('내 기획서 조회 오류:', error.message);
    return res.status(500).json({ message: '내 기획서 목록을 불러오지 못했습니다.' });
  }
});

// 작성자 본인의 기획서 삭제
// DELETE /api/projects/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  const projectId = Number(req.params.id);
  if (!Number.isInteger(projectId) || projectId < 1) {
    return res.status(400).json({ message: '올바른 기획서 번호가 아닙니다.' });
  }

  try {
    const [projects] = await db.query(
      'SELECT image FROM projects WHERE id = ? AND user_id = ? LIMIT 1',
      [projectId, req.user.id],
    );
    if (projects.length === 0) {
      return res.status(404).json({ message: '기획서를 찾을 수 없거나 삭제 권한이 없습니다.' });
    }

    const [result] = await db.query(
      'DELETE FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '기획서를 찾을 수 없거나 삭제 권한이 없습니다.' });
    }

    const image = projects[0].image;
    if (image?.startsWith('/uploads/')) {
      const imageFilename = path.basename(image);
      await unlink(path.join(uploadDirectory, imageFilename)).catch(() => {});
    }

    return res.json({ message: '기획서가 삭제되었습니다.' });
  } catch (error) {
    console.error('기획서 삭제 오류:', error.message);
    return res.status(500).json({ message: '기획서를 삭제하지 못했습니다.' });
  }
});

// 작성자 본인의 기획서 수정
// PUT /api/projects/:id
router.put('/:id', authenticateToken, (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? '이미지는 5MB 이하로 업로드해 주세요.'
      : error.message || '이미지 업로드에 실패했습니다.';
    return res.status(400).json({ message });
  });
}, async (req, res) => {
  const projectId = Number(req.params.id);
  const fields = ['title', 'genre', 'overview', 'gameplay', 'gamesystem', 'story', 'features'];
  const project = Object.fromEntries(fields.map((field) => [field, String(req.body[field] || '').trim()]));

  if (!Number.isInteger(projectId) || projectId < 1) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: '올바른 기획서 번호가 아닙니다.' });
  }
  if (fields.some((field) => !project[field])) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: '모든 기획서 항목을 입력해 주세요.' });
  }
  if (project.title.length > 100 || project.genre.length > 50) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: '제목은 100자, 장르는 50자 이내로 입력해 주세요.' });
  }

  try {
    const [existingProjects] = await db.query(
      'SELECT image FROM projects WHERE id = ? AND user_id = ? LIMIT 1',
      [projectId, req.user.id],
    );
    if (existingProjects.length === 0) {
      await removeUploadedFile(req.file);
      return res.status(404).json({ message: '기획서를 찾을 수 없거나 수정 권한이 없습니다.' });
    }

    const oldImage = existingProjects[0].image;
    const removeImage = req.body.removeImage === 'true';
    const image = req.file
      ? `/uploads/${req.file.filename}`
      : removeImage ? null : oldImage;

    await db.query(`
      UPDATE projects
      SET title = ?, genre = ?, image = ?, overview = ?, gameplay = ?,
          gamesystem = ?, story = ?, features = ?
      WHERE id = ? AND user_id = ?
    `, [
      project.title,
      project.genre,
      image,
      project.overview,
      project.gameplay,
      project.gamesystem,
      project.story,
      project.features,
      projectId,
      req.user.id,
    ]);

    if ((req.file || removeImage) && oldImage?.startsWith('/uploads/')) {
      await unlink(path.join(uploadDirectory, path.basename(oldImage))).catch(() => {});
    }

    return res.json({ message: '기획서가 수정되었습니다.', projectId });
  } catch (error) {
    await removeUploadedFile(req.file);
    console.error('기획서 수정 오류:', error.message);
    return res.status(500).json({ message: '기획서를 수정하지 못했습니다.' });
  }
});

// 기획서 피드백 조회 (기획서 작성자는 섹션별로 조회 가능)
// GET /api/projects/:id/feedbacks?section=overview
router.get('/:id/feedbacks', async (req, res) => {
  const projectId = Number(req.params.id);
  const section = String(req.query.section || '');
  if (!Number.isInteger(projectId) || projectId < 1) {
    return res.status(400).json({ message: '올바른 기획서 번호가 아닙니다.' });
  }
  if (section && !allowedFeedbackSections.includes(section)) {
    return res.status(400).json({ message: '올바른 피드백 섹션이 아닙니다.' });
  }

  try {
    let query = `
      SELECT f.id, f.project_id, f.user_id, f.section, f.content, f.created_at,
             u.nickname AS author
      FROM feedbacks AS f
      JOIN users AS u ON u.id = f.user_id
      WHERE f.project_id = ?
    `;
    const params = [projectId];
    if (section) {
      query += ' AND f.section = ?';
      params.push(section);
    }
    query += ' ORDER BY f.created_at DESC, f.id DESC';

    const [feedbacks] = await db.query(query, params);
    return res.json(feedbacks);
  } catch (error) {
    console.error('피드백 조회 오류:', error.message);
    return res.status(500).json({ message: '피드백을 불러오지 못했습니다.' });
  }
});

// 로그인한 사용자의 섹션별 피드백 작성
// POST /api/projects/:id/feedbacks
router.post('/:id/feedbacks', authenticateToken, async (req, res) => {
  const projectId = Number(req.params.id);
  const section = String(req.body.section || '');
  const content = String(req.body.content || '').trim();

  if (!Number.isInteger(projectId) || projectId < 1) {
    return res.status(400).json({ message: '올바른 기획서 번호가 아닙니다.' });
  }
  if (!allowedFeedbackSections.includes(section)) {
    return res.status(400).json({ message: '피드백을 남길 섹션을 선택해 주세요.' });
  }
  if (!content) {
    return res.status(400).json({ message: '피드백 내용을 입력해 주세요.' });
  }

  try {
    const [projects] = await db.query('SELECT id FROM projects WHERE id = ? LIMIT 1', [projectId]);
    if (projects.length === 0) {
      return res.status(404).json({ message: '기획서를 찾을 수 없습니다.' });
    }

    const [result] = await db.query(
      'INSERT INTO feedbacks (project_id, user_id, section, content) VALUES (?, ?, ?, ?)',
      [projectId, req.user.id, section, content],
    );
    return res.status(201).json({ message: '피드백이 등록되었습니다.', feedbackId: result.insertId });
  } catch (error) {
    console.error('피드백 작성 오류:', error.message);
    return res.status(500).json({ message: '피드백을 등록하지 못했습니다.' });
  }
});

// 피드백 작성자 또는 기획서 작성자의 피드백 삭제
// DELETE /api/projects/:id/feedbacks/:feedbackId
router.delete('/:id/feedbacks/:feedbackId', authenticateToken, async (req, res) => {
  const projectId = Number(req.params.id);
  const feedbackId = Number(req.params.feedbackId);
  if (!Number.isInteger(projectId) || projectId < 1 || !Number.isInteger(feedbackId) || feedbackId < 1) {
    return res.status(400).json({ message: '올바르지 않은 기획서 또는 피드백 번호입니다.' });
  }

  try {
    const [result] = await db.query(`
      DELETE FROM feedbacks
      WHERE id = ?
        AND project_id = ?
        AND (
          user_id = ?
          OR project_id IN (
            SELECT id FROM projects WHERE id = ? AND user_id = ?
          )
        )
    `, [feedbackId, projectId, req.user.id, projectId, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '피드백을 찾을 수 없거나 삭제 권한이 없습니다.' });
    }
    return res.json({ message: '피드백이 삭제되었습니다.' });
  } catch (error) {
    console.error('피드백 삭제 오류:', error.message);
    return res.status(500).json({ message: '피드백을 삭제하지 못했습니다.' });
  }
});

// 기획서 상세와 작성자 정보 조회
// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  const projectId = Number(req.params.id);

  if (!Number.isInteger(projectId) || projectId < 1) {
    return res.status(400).json({ message: '올바른 기획서 번호가 아닙니다.' });
  }

  try {
    const [projects] = await db.query(`
      SELECT
        p.id,
        p.user_id,
        p.title,
        p.genre,
        p.image,
        p.overview,
        p.gameplay,
        p.gamesystem,
        p.story,
        p.features,
        p.created_at,
        p.updated_at,
        u.nickname AS author
      FROM projects AS p
      JOIN users AS u ON u.id = p.user_id
      WHERE p.id = ?
      LIMIT 1
    `, [projectId]);

    if (projects.length === 0) {
      return res.status(404).json({ message: '기획서를 찾을 수 없습니다.' });
    }

    return res.json(projects[0]);
  } catch (error) {
    console.error('기획서 상세 조회 오류:', error.message);
    return res.status(500).json({ message: '기획서 정보를 불러오지 못했습니다.' });
  }
});

export default router;
