import { Request, Response } from 'express';
import { travelService } from './travel.service.js';
import {
  createTripSchema,
  updateTripSchema,
  createSegmentSchema,
  createFareAlertSchema,
  createDocumentSchema,
  createTatkalSchema,
} from './travel.dto.js';

export const travelController = {
  // 1. Overview
  async getOverview(_req: Request, res: Response) {
    try {
      const overview = await travelService.getOverview();
      return res.json(overview);
    } catch (err: any) {
      console.error('[TravelController.getOverview] Error:', err);
      return res.status(500).json({ error: 'Failed to fetch travel overview' });
    }
  },

  // 2. Trips
  async listTrips(req: Request, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const trips = await travelService.getTrips(status);
      return res.json(trips);
    } catch (err: any) {
      console.error('[TravelController.listTrips] Error:', err);
      return res.status(500).json({ error: 'Failed to fetch trips' });
    }
  },

  async getTripById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const trip = await travelService.getTripById(id);
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      return res.json(trip);
    } catch (err: any) {
      console.error('[TravelController.getTripById] Error:', err);
      return res.status(500).json({ error: 'Failed to fetch trip details' });
    }
  },

  async createTrip(req: Request, res: Response) {
    try {
      const parsed = createTripSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.format() });
      }
      const trip = await travelService.createTrip(parsed.data);
      return res.status(201).json(trip);
    } catch (err: any) {
      console.error('[TravelController.createTrip] Error:', err);
      return res.status(500).json({ error: 'Failed to create trip' });
    }
  },

  async updateTrip(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateTripSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.format() });
      }
      const updated = await travelService.updateTrip(id, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      return res.json(updated);
    } catch (err: any) {
      console.error('[TravelController.updateTrip] Error:', err);
      return res.status(500).json({ error: 'Failed to update trip' });
    }
  },

  async deleteTrip(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await travelService.deleteTrip(id);
      if (!success) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      return res.json({ success: true, message: 'Trip deleted successfully' });
    } catch (err: any) {
      console.error('[TravelController.deleteTrip] Error:', err);
      return res.status(500).json({ error: 'Failed to delete trip' });
    }
  },

  async addSegment(req: Request, res: Response) {
    try {
      const { id: tripId } = req.params;
      const parsed = createSegmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.format() });
      }
      const segment = await travelService.addSegment(tripId, parsed.data);
      return res.status(201).json(segment);
    } catch (err: any) {
      console.error('[TravelController.addSegment] Error:', err);
      return res.status(500).json({ error: 'Failed to add itinerary segment' });
    }
  },

  // 3. Airfares
  async listFares(_req: Request, res: Response) {
    try {
      const fares = await travelService.getFareAlerts();
      return res.json(fares);
    } catch (err: any) {
      console.error('[TravelController.listFares] Error:', err);
      return res.status(500).json({ error: 'Failed to fetch fare alerts' });
    }
  },

  async createFare(req: Request, res: Response) {
    try {
      const parsed = createFareAlertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.format() });
      }
      const fare = await travelService.createFareAlert(parsed.data);
      return res.status(201).json(fare);
    } catch (err: any) {
      console.error('[TravelController.createFare] Error:', err);
      return res.status(500).json({ error: 'Failed to create airfare alert' });
    }
  },

  async deleteFare(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await travelService.deleteFareAlert(id);
      if (!success) {
        return res.status(404).json({ error: 'Fare alert not found' });
      }
      return res.json({ success: true, message: 'Fare alert removed' });
    } catch (err: any) {
      console.error('[TravelController.deleteFare] Error:', err);
      return res.status(500).json({ error: 'Failed to delete fare alert' });
    }
  },

  // 4. Documents
  async listDocuments(_req: Request, res: Response) {
    try {
      const docs = await travelService.getDocuments();
      return res.json(docs);
    } catch (err: any) {
      console.error('[TravelController.listDocuments] Error:', err);
      return res.status(500).json({ error: 'Failed to fetch travel documents' });
    }
  },

  async createDocument(req: Request, res: Response) {
    try {
      const parsed = createDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.format() });
      }
      const doc = await travelService.createDocument(parsed.data);
      return res.status(201).json(doc);
    } catch (err: any) {
      console.error('[TravelController.createDocument] Error:', err);
      return res.status(500).json({ error: 'Failed to save travel document' });
    }
  },

  // 5. Tatkal Assistant
  async listTatkal(_req: Request, res: Response) {
    try {
      const tatkalTasks = await travelService.getTatkalTasks();
      return res.json(tatkalTasks);
    } catch (err: any) {
      console.error('[TravelController.listTatkal] Error:', err);
      return res.status(500).json({ error: 'Failed to fetch tatkal tasks' });
    }
  },

  async createTatkal(req: Request, res: Response) {
    try {
      const parsed = createTatkalSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.format() });
      }
      const task = await travelService.createTatkalTask(parsed.data);
      return res.status(201).json(task);
    } catch (err: any) {
      console.error('[TravelController.createTatkal] Error:', err);
      return res.status(500).json({ error: 'Failed to create tatkal task' });
    }
  },
};
