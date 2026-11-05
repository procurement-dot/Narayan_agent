import { Request, Response } from 'express';
import { growthService } from './growth.service.js';
import {
  createSkillPathSchema,
  updateSkillProgressSchema,
  createHabitSchema,
  createAssessmentSchema,
  createLibraryItemSchema,
  updateLibraryStatusSchema,
} from './growth.dto.js';

export class GrowthController {
  // GET /api/growth/overview
  async getOverview(req: Request, res: Response) {
    try {
      const overview = await growthService.getOverview();
      return res.status(200).json({ success: true, data: overview });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/growth/paths
  async getSkillPaths(req: Request, res: Response) {
    try {
      const paths = await growthService.getSkillPaths();
      return res.status(200).json({ success: true, data: paths });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/growth/paths
  async createSkillPath(req: Request, res: Response) {
    try {
      const parseResult = createSkillPathSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, error: parseResult.error.format() });
      }
      const created = await growthService.createSkillPath(parseResult.data);
      return res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH /api/growth/paths/:id/progress
  async updateSkillProgress(req: Request, res: Response) {
    try {
      const parseResult = updateSkillProgressSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, error: parseResult.error.format() });
      }
      const updated = await growthService.updateSkillProgress(
        req.params.id,
        parseResult.data.progress,
        parseResult.data.status
      );
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(err.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: err.message,
      });
    }
  }

  // GET /api/growth/habits
  async getHabits(req: Request, res: Response) {
    try {
      const habits = await growthService.getHabits();
      return res.status(200).json({ success: true, data: habits });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/growth/habits
  async createHabit(req: Request, res: Response) {
    try {
      const parseResult = createHabitSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, error: parseResult.error.format() });
      }
      const created = await growthService.createHabit(parseResult.data);
      return res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH /api/growth/habits/:id/toggle
  async toggleHabit(req: Request, res: Response) {
    try {
      const updated = await growthService.toggleHabit(req.params.id);
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(err.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: err.message,
      });
    }
  }

  // GET /api/growth/assessments
  async getAssessments(req: Request, res: Response) {
    try {
      const assessments = await growthService.getAssessments();
      return res.status(200).json({ success: true, data: assessments });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/growth/assessments
  async createAssessment(req: Request, res: Response) {
    try {
      const parseResult = createAssessmentSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, error: parseResult.error.format() });
      }
      const created = await growthService.createAssessment(parseResult.data);
      return res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/growth/library
  async getLibrary(req: Request, res: Response) {
    try {
      const library = await growthService.getLibrary();
      return res.status(200).json({ success: true, data: library });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/growth/library
  async createLibraryItem(req: Request, res: Response) {
    try {
      const parseResult = createLibraryItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, error: parseResult.error.format() });
      }
      const created = await growthService.createLibraryItem(parseResult.data);
      return res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PATCH /api/growth/library/:id/status
  async updateLibraryStatus(req: Request, res: Response) {
    try {
      const parseResult = updateLibraryStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, error: parseResult.error.format() });
      }
      const updated = await growthService.updateLibraryStatus(
        req.params.id,
        parseResult.data.readingStatus
      );
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(err.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: err.message,
      });
    }
  }
}

export const growthController = new GrowthController();
