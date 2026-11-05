import { Router } from 'express';
import { growthController } from './growth.controller.js';

const router = Router();

// 1. Overview
router.get('/overview', (req, res) => growthController.getOverview(req, res));

// 2. Skill Pathways (Learn)
router.get('/paths', (req, res) => growthController.getSkillPaths(req, res));
router.post('/paths', (req, res) => growthController.createSkillPath(req, res));
router.patch('/paths/:id/progress', (req, res) => growthController.updateSkillProgress(req, res));

// 3. Daily Habits (Practice)
router.get('/habits', (req, res) => growthController.getHabits(req, res));
router.post('/habits', (req, res) => growthController.createHabit(req, res));
router.patch('/habits/:id/toggle', (req, res) => growthController.toggleHabit(req, res));

// 4. Assessments (Assess)
router.get('/assessments', (req, res) => growthController.getAssessments(req, res));
router.post('/assessments', (req, res) => growthController.createAssessment(req, res));

// 5. Curated Discoveries (Discover / Library)
router.get('/library', (req, res) => growthController.getLibrary(req, res));
router.post('/library', (req, res) => growthController.createLibraryItem(req, res));
router.patch('/library/:id/status', (req, res) => growthController.updateLibraryStatus(req, res));

export const growthRoutes = router;
