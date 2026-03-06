import { z } from 'zod';
import { insertPilgrimSchema, pilgrims, emergencies, insertEmergencySchema, alerts, insertAlertSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  pilgrims: {
    list: {
      method: 'GET' as const,
      path: '/api/pilgrims' as const,
      responses: {
        200: z.array(z.custom<typeof pilgrims.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/pilgrims/:id' as const,
      responses: {
        200: z.custom<typeof pilgrims.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/pilgrims' as const,
      input: insertPilgrimSchema,
      responses: {
        201: z.custom<typeof pilgrims.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateLocation: {
      method: 'PATCH' as const,
      path: '/api/pilgrims/:id/location' as const,
      input: z.object({
        locationLat: z.number(),
        locationLng: z.number(),
      }),
      responses: {
        200: z.custom<typeof pilgrims.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  emergencies: {
    list: {
      method: 'GET' as const,
      path: '/api/emergencies' as const,
      responses: {
        200: z.array(z.custom<typeof emergencies.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/emergencies' as const,
      input: insertEmergencySchema,
      responses: {
        201: z.custom<typeof emergencies.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    resolve: {
      method: 'PATCH' as const,
      path: '/api/emergencies/:id/resolve' as const,
      responses: {
        200: z.custom<typeof emergencies.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  alerts: {
    list: {
      method: 'GET' as const,
      path: '/api/alerts' as const,
      responses: {
        200: z.array(z.custom<typeof alerts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/alerts' as const,
      input: insertAlertSchema,
      responses: {
        201: z.custom<typeof alerts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },
  ai: {
    translate: {
      method: 'POST' as const,
      path: '/api/ai/translate' as const,
      input: z.object({
        text: z.string(),
        targetLanguage: z.string(), // e.g. "Arabic", "Urdu", "French"
      }),
      responses: {
        200: z.object({
          translatedText: z.string(),
        }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
