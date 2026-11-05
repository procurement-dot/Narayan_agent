import { Router } from 'express';
import { kickstartController } from './kickstart.controller.js';

const router = Router();

// 1. All-in-one Executive Brief
router.get('/today', (req, res) => kickstartController.getTodaySynthesis(req, res));

// 2. Daily Agenda Timeline
router.get('/timeline', (req, res) => kickstartController.getTimeline(req, res));
router.post('/timeline', (req, res) => kickstartController.createTimelineItem(req, res));
router.patch('/timeline/:id/toggle', (req, res) => kickstartController.toggleTimelineItem(req, res));

// 3. Weather & AQI
router.get('/weather', (req, res) => kickstartController.getWeather(req, res));

// 4. Curated News & Headlines
router.get('/news', (req, res) => kickstartController.getNews(req, res));

// 5. Astrological & Mindset Reflection
router.get('/astro', (req, res) => kickstartController.getAstro(req, res));

// 6. Audio Briefing
router.get('/audio', (req, res) => kickstartController.getAudioBrief(req, res));

export const kickstartRoutes = router;
