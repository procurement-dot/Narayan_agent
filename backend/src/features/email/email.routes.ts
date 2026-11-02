import { Router } from 'express';
import { emailController } from './email.controller.js';

export const emailRouter = Router();

emailRouter.get('/summary', emailController.getSummary);
emailRouter.get('/', emailController.listEmails);
emailRouter.put('/:id/draft', emailController.saveDraft);
emailRouter.post('/:id/archive', emailController.archiveEmail);
emailRouter.get('/:id/proposal', emailController.getProposal);
emailRouter.post('/proposals/:id/approve', emailController.approveProposal);
emailRouter.post('/proposals/:id/dismiss', emailController.dismissProposal);
