import { Request, Response } from 'express';
import { kickstartService } from './kickstart.service.js';
import { createTimelineItemSchema } from './kickstart.dto.js';

export class KickstartController {
  // GET /api/kickstart/today
  async getTodaySynthesis(req: Request, res: Response) {
    try {
      const synthesis = await kickstartService.getTodaySynthesis();
      return res.status(200).json({ success: true, data: synthesis });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/kickstart/timeline
  async getTimeline(req: Request, res: Response) {
    try {
      const timeline = await kickstartService.getTimeline();
      return res.status(200).json({ success: true, data: timeline });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/kickstart/timeline
  async createTimelineItem(req: Request, res: Response) {
    try {
      const parseResult = createTimelineItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, error: parseResult.error.format() });
      }
      const created = await kickstartService.createTimelineItem(parseResult.data);
      return res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH /api/kickstart/timeline/:id/toggle
  async toggleTimelineItem(req: Request, res: Response) {
    try {
      const updated = await kickstartService.toggleTimelineItem(req.params.id);
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(err.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: err.message,
      });
    }
  }

  // GET /api/kickstart/weather
  async getWeather(req: Request, res: Response) {
    try {
      const weather = await kickstartService.getWeather();
      return res.status(200).json({ success: true, data: weather });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/kickstart/news
  async getNews(req: Request, res: Response) {
    try {
      const news = await kickstartService.getNews();
      return res.status(200).json({ success: true, data: news });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/kickstart/astro
  async getAstro(req: Request, res: Response) {
    try {
      const astro = await kickstartService.getAstro();
      return res.status(200).json({ success: true, data: astro });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/kickstart/audio
  async getAudioBrief(req: Request, res: Response) {
    try {
      const audioBrief = await kickstartService.getAudioBrief();
      return res.status(200).json({ success: true, data: audioBrief });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const kickstartController = new KickstartController();
