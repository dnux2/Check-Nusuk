import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Pilgrims
  app.get(api.pilgrims.list.path, async (req, res) => {
    const pilgrims = await storage.getPilgrims();
    res.json(pilgrims);
  });

  app.get(api.pilgrims.get.path, async (req, res) => {
    const pilgrim = await storage.getPilgrim(Number(req.params.id));
    if (!pilgrim) {
      return res.status(404).json({ message: "Pilgrim not found" });
    }
    res.json(pilgrim);
  });

  app.post(api.pilgrims.create.path, async (req, res) => {
    try {
      const input = api.pilgrims.create.input.parse(req.body);
      const pilgrim = await storage.createPilgrim(input);
      res.status(201).json(pilgrim);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(api.pilgrims.updateLocation.path, async (req, res) => {
    try {
      const input = api.pilgrims.updateLocation.input.parse(req.body);
      const pilgrim = await storage.updatePilgrimLocation(
        Number(req.params.id),
        input.locationLat,
        input.locationLng
      );
      res.json(pilgrim);
    } catch (err) {
      return res.status(400).json({ message: "Invalid input" });
    }
  });

  // Emergencies
  app.get(api.emergencies.list.path, async (req, res) => {
    const emergencies = await storage.getEmergencies();
    res.json(emergencies);
  });

  app.post(api.emergencies.create.path, async (req, res) => {
    try {
      const input = api.emergencies.create.input.parse(req.body);
      const emergency = await storage.createEmergency(input);
      res.status(201).json(emergency);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(api.emergencies.resolve.path, async (req, res) => {
    try {
      const resolved = await storage.resolveEmergency(Number(req.params.id));
      res.json(resolved);
    } catch (err) {
      res.status(404).json({ message: "Emergency not found" });
    }
  });

  // Alerts
  app.get(api.alerts.list.path, async (req, res) => {
    const alerts = await storage.getAlerts();
    res.json(alerts);
  });

  app.post(api.alerts.create.path, async (req, res) => {
    try {
      const input = api.alerts.create.input.parse(req.body);
      const alert = await storage.createAlert(input);
      res.status(201).json(alert);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // AI Translator
  app.post(api.ai.translate.path, async (req, res) => {
    try {
      const { text, targetLanguage } = api.ai.translate.input.parse(req.body);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: `You are a helpful translator for the Hajj & Umrah pilgrimage platform. Translate the following text into ${targetLanguage}. Return ONLY the translated text, without any additional explanations.` },
          { role: "user", content: text }
        ],
      });

      const translatedText = response.choices[0]?.message?.content || "Translation failed";
      res.json({ translatedText });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Internal server error during translation" });
    }
  });

  // Chat Messages
  app.get("/api/chat/messages", async (req, res) => {
    const pilgrimId = req.query.pilgrimId ? Number(req.query.pilgrimId) : undefined;
    const messages = await storage.getChatMessages(pilgrimId);
    res.json(messages);
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const input = insertChatMessageSchema.parse(req.body);
      const msg = await storage.createChatMessage(input);
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Seed data function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingPilgrims = await storage.getPilgrims();
  if (existingPilgrims.length === 0) {
    await storage.createPilgrim({
      name: "Ahmed Ali",
      nationality: "Egyptian",
      passportNumber: "A12345678",
      phone: "+201001234567",
      campaignGroup: "Al-Tawheed Group",
      permitStatus: "Valid",
      locationLat: 21.4225,
      locationLng: 39.8262,
      emergencyStatus: false,
    });

    await storage.createPilgrim({
      name: "Muhammad Rahman",
      nationality: "Indonesian",
      passportNumber: "B98765432",
      phone: "+6281234567890",
      campaignGroup: "Hajj Travel Indo",
      permitStatus: "Valid",
      locationLat: 21.4230,
      locationLng: 39.8250,
      emergencyStatus: true,
    });

    await storage.createPilgrim({
      name: "Fatima Noor",
      nationality: "Pakistani",
      passportNumber: "C45678912",
      phone: "+923001234567",
      campaignGroup: "Pak-Hajj Campaign",
      permitStatus: "None",
      locationLat: 21.4210,
      locationLng: 39.8270,
      emergencyStatus: false,
    });
  }

  const existingAlerts = await storage.getAlerts();
  if (existingAlerts.length === 0) {
    await storage.createAlert({
      type: "Crowd Density",
      message: "High crowd density detected near King Abdulaziz Gate. Recommend diverting to King Fahd Gate.",
      locationLat: 21.4225,
      locationLng: 39.8262,
      status: "Active",
    });

    await storage.createAlert({
      type: "Unauthorized",
      message: "Face detection triggered: Potential unauthorized pilgrim detected in sector 4.",
      locationLat: 21.4210,
      locationLng: 39.8270,
      status: "Active",
    });
  }

  const existingEmergencies = await storage.getEmergencies();
  if (existingEmergencies.length === 0) {
    await storage.createEmergency({
      pilgrimId: 2,
      type: "Medical",
      status: "Active",
      locationLat: 21.4230,
      locationLng: 39.8250,
    });
  }
}
