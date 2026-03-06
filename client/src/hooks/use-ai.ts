import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useTranslate() {
  return useMutation({
    mutationFn: async (input: z.infer<typeof api.ai.translate.input>) => {
      const validated = api.ai.translate.input.parse(input);
      const res = await fetch(api.ai.translate.path, {
        method: api.ai.translate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to translate text");
      const data = await res.json();
      return parseWithLogging(api.ai.translate.responses[200], data, "ai.translate");
    },
  });
}
