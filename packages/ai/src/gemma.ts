const MODEL = "gemma-4-31b-it";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export type Message = {
  role: "user" | "model";
  content: string;
};

export type StreamChunk = {
  text: string;
  done: boolean;
};

export class GemmaClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async *streamChat(
    messages: Message[],
    signal?: AbortSignal
  ): AsyncGenerator<StreamChunk> {
    const response = await fetch(
      `${BASE_URL}/models/${MODEL}:streamGenerateContent?alt=sse&key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
        signal,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemma API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            yield { text: "", done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const text =
              parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (text) yield { text, done: false };
          } catch {
            // skip malformed chunks
          }
        }
      }
    }

    yield { text: "", done: true };
  }

  async chat(messages: Message[]): Promise<string> {
    const response = await fetch(
      `${BASE_URL}/models/${MODEL}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemma API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }
}
