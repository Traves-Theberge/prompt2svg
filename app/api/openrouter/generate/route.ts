import { NextRequest, NextResponse } from "next/server";
import { validateGenerationRequest, formatValidationErrors } from "@/lib/validations";

/**
 * POST /api/openrouter/generate
 * 
 * Generates an SVG using OpenRouter AI models.
 * Validates request body with Zod before processing.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENROUTER_API_KEY" },
      { status: 500 }
    );
  }

  // Parse request body
  const body = await request.json().catch(() => ({}));
  
  // Validate request with Zod
  const validationResult = validateGenerationRequest(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: "Invalid request body", 
        details: formatValidationErrors(validationResult) 
      },
      { status: 400 }
    );
  }
  
  // Extract validated data
  const {
    iconSVGCode,
    sourceIconName,
    userPrompt: prompt,
    systemPrompt: clientSystemPrompt,
    selectedModel,
    parameters,
  } = validationResult.data;
  
  const { primaryColor, outlineWidth } = parameters;

  const referer = process.env.OPENROUTER_SITE_URL ?? "http://localhost";
  const title = process.env.OPENROUTER_APP_NAME ?? "prompt2svg";

  // Use client-provided system prompt if available, otherwise construct one
  const systemPrompt = clientSystemPrompt || 
    `You are an expert SVG designer. Produce clean, valid SVG markup based on a source icon and style constraints.
    
    Core Principles:
    - Declarative Graphics: Describe shapes using XML tags.
    - Infinite Canvas: Use viewBox to define the visible window.
    - Portability: Use SVG attributes (fill="...", stroke="...") instead of CSS.
    
    Technical Standards:
    - ALWAYS include a viewBox (e.g., "0 0 24 24").
    - Use <path> for complex shapes, but <rect>/<circle> for primitives.
    - Use stroke-linecap="round" and stroke-linejoin="round" for smoother lines.
    - Include a <title> tag for accessibility.
    - Use 'currentColor' for strokes/fills to allow client-side styling.`;

  // Construct the user prompt
  // We avoid duplicating the source code if it's already in the system prompt.
  
  const userPromptParts = [
    "TASK: Generate a valid SVG icon based on the source and parameters below.",
    "OUTPUT FORMAT: JSON object with keys 'svg' (string) and 'explanation' (string).",
    "",
    "INPUTS:",
    `1. Source Icon Name: ${sourceIconName}`,
  ];

  // Only add source details if NOT using a client system prompt (which already has them)
  if (!clientSystemPrompt) {
    userPromptParts.push(
      `2. Source SVG Code: ${iconSVGCode}`
    );
  }

  userPromptParts.push(
    "",
    "PARAMETERS:",
    `- Use 'currentColor' for all stroke/fill colors.`,
    `- Use standard stroke-width="2" (will be adjusted by client).`,
    "",
    `USER INSTRUCTIONS: ${prompt && prompt.trim() ? prompt : "Enhance the icon based on parameters."}`,
    "",
    "CONSTRAINTS:",
    "- Return ONLY valid SVG code in the 'svg' field.",
    "- Do not use <style> tags or external CSS.",
    "- Ensure the SVG scales correctly (viewBox='0 0 24 24').",
    "- NO markdown formatting in the JSON response.",
    "- JSON ONLY. Do not include any conversational text before or after the JSON object."
  );

  const userPrompt = userPromptParts.join("\n");

  const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": title,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!openrouterRes.ok) {
    const text = await openrouterRes.text().catch(() => "");
    return NextResponse.json(
      { error: `OpenRouter error (${openrouterRes.status})`, details: text },
      { status: 502 }
    );
  }

  const openrouterData = (await openrouterRes.json().catch(() => ({}))) as Record<string, unknown>;
  const choices = Array.isArray(openrouterData?.choices) ? openrouterData.choices : [];
  const firstChoice = choices[0] as Record<string, unknown> | undefined;
  const message = (firstChoice?.message as Record<string, unknown> | undefined);
  const content: string | undefined = typeof message?.content === 'string' ? message.content : undefined;
  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "No response content from OpenRouter" },
      { status: 502 }
    );
  }

  const tryParseJson = (raw: string): { svg?: string; explanation?: string } | null => {
    const trimmed = raw.trim();
    
    // 1. Try direct parse
    if (trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        // fall through
      }
    }
    
    // 2. Try extracting from markdown code blocks
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        // fall through
      }
    }

    // 3. Try finding the first '{' and last '}' to handle preamble text
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const potentialJson = trimmed.substring(firstBrace, lastBrace + 1);
        return JSON.parse(potentialJson);
      } catch {
        return null;
      }
    }

    return null;
  };

  const parsed = tryParseJson(content);
  let svg = (parsed?.svg ?? "").trim();
  let explanation = (parsed?.explanation ?? "").trim();

  if (!svg) {
    const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      svg = svgMatch[0].trim();
      explanation = explanation || content.replace(svgMatch[0], "").trim();
    }
  }

  // Validation & Enforcement
  if (!svg) {
    // If we still don't have an SVG, return an error instead of wrapping garbage in a text tag.
    return NextResponse.json(
      { error: "Failed to generate valid SVG", details: content.slice(0, 500) },
      { status: 422 }
    );
  } else {
    // Ensure xmlns
    if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
  }

  return NextResponse.json({ svg, explanation });
}
