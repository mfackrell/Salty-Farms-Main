import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  generateRun,
  getRun,
  listRuns,
  patchDraft,
  previewHtml,
  publishRun,
  updateSelection
} from '../controllers/runs.controller.js';
import { ingestFacebookPosts } from '../controllers/webhooks.controller.js';

const router = Router();
const webhookLimiter = rateLimit({ windowMs: 60_000, max: 20 });
const generateLimiter = rateLimit({ windowMs: 60_000, max: 10 });

router.post('/webhooks/zapier/facebook-posts', webhookLimiter, ingestFacebookPosts);
router.get('/runs', listRuns);
router.get('/runs/:runId', getRun);
router.put('/runs/:runId/selection', updateSelection);
router.post('/runs/:runId/generate', generateLimiter, generateRun);
router.patch('/runs/:runId/draft', patchDraft);
router.post('/runs/:runId/preview-html', previewHtml);
router.post('/runs/:runId/publish', publishRun);

export default router;
