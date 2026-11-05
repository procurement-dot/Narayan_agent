import { Request, Response } from 'express';
import { healthService } from './health.service.js';
import {
  AnalyzeMealDto,
  AnalyzeReportDto,
  ConnectWearableDto,
  CreateEventDto,
  CreateGoalDto,
  DisconnectWearableDto,
  LogVitalsDto,
  MeasurePulseDto,
  PersonNameSchema,
  RecordPhoneRunDto,
  SaveJournalDto,
  SyncPhoneStepsDto,
  SyncWearableDto,
  UpdateGoalDto,
  UpdateTrainingSessionDto,
  UploadDocumentDto,
} from './health.dto.js';

export const healthController = {
  async getDashboard(req: Request, res: Response) {
    try {
      const personParsed = PersonNameSchema.safeParse(req.query.person);
      const person = personParsed.success ? personParsed.data : 'Self';
      const dashboard = await healthService.getDashboard(person);
      res.json({ success: true, data: dashboard });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async logVitals(req: Request, res: Response) {
    try {
      const parsed = LogVitalsDto.parse(req.body);
      const record = await healthService.logVitals(parsed);
      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // Wearables Live Telemetry Sync
  async syncWearables(req: Request, res: Response) {
    try {
      const parsed = SyncWearableDto.parse(req.body);
      const result = await healthService.syncWearables(parsed);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // Pair & Connect Wearable
  async connectWearable(req: Request, res: Response) {
    try {
      const parsed = ConnectWearableDto.parse(req.body);
      const result = await healthService.connectWearable(parsed);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // Disconnect Wearable
  async disconnectWearable(req: Request, res: Response) {
    try {
      const parsed = DisconnectWearableDto.parse(req.body);
      const result = await healthService.disconnectWearable(parsed);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // Scan Nearby Bluetooth BLE Devices
  async scanNearbyWearables(req: Request, res: Response) {
    try {
      const brand = req.query.brand as string | undefined;
      const devices = await healthService.scanNearbyBluetoothDevices(brand);
      res.json({ success: true, data: devices });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Phone Pedometer Sync
  async syncPhoneSteps(req: Request, res: Response) {
    try {
      const parsed = SyncPhoneStepsDto.parse(req.body);
      const result = await healthService.syncPhoneSteps(parsed);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // Phone Camera Pulse Measure
  async measurePulse(req: Request, res: Response) {
    try {
      const parsed = MeasurePulseDto.parse(req.body);
      const result = await healthService.measurePulse(parsed);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // Phone GPS Run Session
  async recordPhoneRun(req: Request, res: Response) {
    try {
      const parsed = RecordPhoneRunDto.parse(req.body);
      const result = await healthService.recordPhoneRun(parsed);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // AI Multimodal Lab Report Analysis
  async analyzeLabReport(req: Request, res: Response) {
    try {
      const parsed = AnalyzeReportDto.parse(req.body);
      const document = await healthService.analyzeLabReport(parsed);
      res.status(201).json({ success: true, data: document });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // AI Multimodal Meal Photo Analysis
  async analyzeMealPlate(req: Request, res: Response) {
    try {
      const parsed = AnalyzeMealDto.parse(req.body);
      const meal = await healthService.analyzeMealPlate(parsed);
      res.status(201).json({ success: true, data: meal });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async getMealLogs(req: Request, res: Response) {
    try {
      const personParsed = PersonNameSchema.safeParse(req.query.person);
      const person = personParsed.success ? personParsed.data : 'Self';
      const meals = await healthService.getMealLogs(person);
      res.json({ success: true, data: meals });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Goals
  async listGoals(_req: Request, res: Response) {
    try {
      const goals = await healthService.listGoals();
      res.json({ success: true, data: goals });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createGoal(req: Request, res: Response) {
    try {
      const parsed = CreateGoalDto.parse(req.body);
      const goal = await healthService.createGoal(parsed);
      res.status(201).json({ success: true, data: goal });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async updateGoal(req: Request, res: Response) {
    try {
      const parsed = UpdateGoalDto.parse(req.body);
      const goal = await healthService.updateGoal(req.params.id, parsed);
      res.json({ success: true, data: goal });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async deleteGoal(req: Request, res: Response) {
    try {
      const result = await healthService.deleteGoal(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  },

  // Training Sessions
  async getTrainingPlan(req: Request, res: Response) {
    try {
      const week = req.query.week ? parseInt(req.query.week as string, 10) : 4;
      const sessions = await healthService.getTrainingPlan(week);
      res.json({ success: true, data: sessions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateTrainingSession(req: Request, res: Response) {
    try {
      const parsed = UpdateTrainingSessionDto.parse(req.body);
      const session = await healthService.updateTrainingSession(req.params.id, parsed);
      res.json({ success: true, data: session });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async syncSessionToCalendar(req: Request, res: Response) {
    try {
      const result = await healthService.syncSessionToCalendar(req.params.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // Events
  async listSportsEvents(_req: Request, res: Response) {
    try {
      const events = await healthService.listSportsEvents();
      res.json({ success: true, data: events });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createSportsEvent(req: Request, res: Response) {
    try {
      const parsed = CreateEventDto.parse(req.body);
      const event = await healthService.createSportsEvent(parsed);
      res.status(201).json({ success: true, data: event });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // Journals
  async listJournals(req: Request, res: Response) {
    try {
      const personParsed = PersonNameSchema.safeParse(req.query.person);
      const person = personParsed.success ? personParsed.data : 'Self';
      const journals = await healthService.listJournals(person);
      res.json({ success: true, data: journals });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async saveJournal(req: Request, res: Response) {
    try {
      const parsed = SaveJournalDto.parse(req.body);
      const journal = await healthService.saveJournal(parsed);
      res.status(201).json({ success: true, data: journal });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // Documents
  async listDocuments(req: Request, res: Response) {
    try {
      const personParsed = PersonNameSchema.safeParse(req.query.person);
      const person = personParsed.success ? personParsed.data : 'Self';
      const docs = await healthService.listDocuments(person);
      res.json({ success: true, data: docs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async uploadDocument(req: Request, res: Response) {
    try {
      const parsed = UploadDocumentDto.parse(req.body);
      const doc = await healthService.uploadDocument(parsed);
      res.status(201).json({ success: true, data: doc });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // Family Profiles
  async getFamilyProfiles(_req: Request, res: Response) {
    try {
      const profiles = await healthService.getFamilyProfiles();
      res.json({ success: true, data: profiles });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
