import { NextResponse } from "next/server";
import { validateModels } from "@/lib/validations";

/**
 * Raw model structure from OpenRouter API.
 */
type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
  };
};

/**
 * GET /api/openrouter/models
 * 
 * Fetches available AI models from OpenRouter.
 * Validates and filters models before returning.
 */
export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENROUTER_API_KEY" },
      { status: 500 }
    );
  }

  const referer = process.env.OPENROUTER_SITE_URL ?? "http://localhost";
  const title = process.env.OPENROUTER_APP_NAME ?? "prompt2svg";

  const res = await fetch("https://openrouter.ai/api/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": referer,
      "X-Title": title,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `OpenRouter error (${res.status})`, details: text },
      { status: 502 }
    );
  }

  const json = (await res.json()) as { data?: OpenRouterModel[] };
  const rawModels = Array.isArray(json?.data) ? json.data : [];
  
  // Transform and prepare models for validation
  const modelsToValidate = rawModels.map((m) => ({
    id: m.id,
    name: m.name || m.id,
    context_length: typeof m.context_length === 'number' ? m.context_length : 4096,
    pricing: {
      prompt: typeof m.pricing?.prompt === 'number' 
        ? m.pricing.prompt 
        : typeof m.pricing?.prompt === 'string' 
          ? parseFloat(m.pricing.prompt) 
          : 0,
      completion: typeof m.pricing?.completion === 'number' 
        ? m.pricing.completion 
        : typeof m.pricing?.completion === 'string' 
          ? parseFloat(m.pricing.completion) 
          : 0,
    },
  }));
  
  // Validate models with Zod
  const validationResult = validateModels(modelsToValidate);
  
  if (!validationResult.success) {
    console.warn('Some models failed validation:', validationResult.error);
    // Return empty array if validation fails completely
    return NextResponse.json([]);
  }
  
  // Return only validated models
  return NextResponse.json(validationResult.data);
}
