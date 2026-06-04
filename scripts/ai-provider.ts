export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateTextOptions = {
  messages: ChatMessage[];
  temperature?: number;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class DailyCallLimit {
  private used = 0;

  constructor(private readonly maxCalls: number) {}

  consume() {
    if (this.used >= this.maxCalls) {
      throw new Error(`Daily AI call limit reached: ${this.maxCalls}`);
    }
    this.used += 1;
  }

  get count() {
    return this.used;
  }
}

export function createDailyCallLimit() {
  const maxCalls = Number.parseInt(process.env.MAX_DAILY_AI_CALLS || "25", 10);
  return new DailyCallLimit(Number.isFinite(maxCalls) && maxCalls > 0 ? maxCalls : 25);
}

export async function generateText(options: GenerateTextOptions, limit: DailyCallLimit) {
  const baseUrl = process.env.AI_BASE_URL || "https://apihub.agnes-ai.com/v1";
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "agnes-2.0-flash";

  if (!apiKey) {
    throw new Error("AI_API_KEY is not set. Keep local previews on checked-in data or configure secrets in CI.");
  }

  limit.consume();

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.4
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI request failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("AI response did not include message content.");
  }

  return content;
}
