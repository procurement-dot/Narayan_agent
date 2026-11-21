import { Router } from 'express';
import { emailController } from './email.controller.js';

export const emailRouter = Router();

// OAuth endpoints
emailRouter.get('/oauth/auth-url', emailController.getOAuthUrl);
emailRouter.get('/oauth/callback', emailController.handleOAuthCallback);
emailRouter.get('/oauth/status', emailController.getOAuthStatus);
emailRouter.post('/oauth/disconnect', emailController.disconnectAccount);

// Sync endpoint
emailRouter.post('/sync', emailController.syncEmails);

// Email & proposal endpoints
emailRouter.get('/summary', emailController.getSummary);
emailRouter.get('/', emailController.listEmails);
emailRouter.put('/:id/draft', emailController.saveDraft);
emailRouter.post('/:id/generate-draft', emailController.generateDraft);
emailRouter.post('/:id/send', emailController.sendReply);
emailRouter.post('/batch-trash', emailController.batchTrashEmails);
emailRouter.post('/trash', emailController.batchTrashEmails);
emailRouter.post('/scan-unwanted', emailController.scanUnwanted);
emailRouter.post('/:id/trash', emailController.trashEmail);
emailRouter.post('/:id/archive', emailController.archiveEmail);
emailRouter.get('/:id/proposal', emailController.getProposal);
emailRouter.post('/proposals/:id/approve', emailController.approveProposal);
emailRouter.post('/proposals/:id/dismiss', emailController.dismissProposal);
