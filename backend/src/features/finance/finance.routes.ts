import { Router } from 'express';
import { financeController } from './finance.controller.js';

export const financeRouter = Router();

// Overview & Analytics
financeRouter.get('/overview', financeController.getOverview);

// Assets
financeRouter.get('/assets', financeController.getAssets);
financeRouter.post('/assets', financeController.createAsset);
financeRouter.put('/assets/:id/rent', financeController.updateAssetRent);
financeRouter.delete('/assets/:id', financeController.deleteAsset);

// Lending
financeRouter.get('/loans', financeController.getLoans);
financeRouter.post('/loans', financeController.createLoan);
financeRouter.patch('/loans/:id/toggle-paid', financeController.toggleLoanPaid);
financeRouter.delete('/loans/:id', financeController.deleteLoan);

// SMS Sync & Transactions
financeRouter.post('/sms/sync', financeController.syncSmsTransactions);
financeRouter.get('/sms/transactions', financeController.getTransactions);
financeRouter.post('/email/sync', financeController.syncEmailCredits);

// Retirement
financeRouter.get('/retirement', financeController.getRetirement);
financeRouter.put('/retirement', financeController.updateRetirement);

// Records Vault
financeRouter.get('/records', financeController.getRecords);
financeRouter.post('/records', financeController.createRecord);
financeRouter.post('/records/:id/attach', financeController.attachDocument);
