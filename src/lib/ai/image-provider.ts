export type GeneratedImage = {
  bytes: Uint8Array;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  extension: "png" | "jpg" | "webp";
  model: string;
};

type ImageProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const maxImageBytes = 6 * 1024 * 1024;

export function imageProviderConfig(
  env: Record<string, string | undefined> = process.env,
): ImageProviderConfig | null {
  const apiKey = env.IMAGE_API_KEY ?? env.AI_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl:
      env.IMAGE_BASE_URL ?? env.AI_BASE_URL ?? "https://api.openai.com/v1",
    model: env.IMAGE_MODEL ?? "gpt-image-1.5",
  };
}

export async function generateImage(
  prompt: string,
  config: ImageProviderConfig,
  request: typeof fetch = fetch,
): Promise<GeneratedImage> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) throw new Error("The creative brief is empty.");
  if (cleanPrompt.length > 6000)
    throw new Error("The creative brief is too long for image generation.");
  const response = await request(
    `${config.baseUrl.replace(/\/$/, "")}/images/generations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        prompt: `${cleanPrompt}\nCreate a polished square social-media image. Do not add text, logos, testimonials, prices, certifications, or unverified claims.`,
        size: "1024x1024",
        quality: "medium",
        output_format: "png",
      }),
      signal: AbortSignal.timeout(120000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Image provider request failed with status ${response.status}.`,
    );
  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  const encoded = payload.data?.[0]?.b64_json;
  if (!encoded) throw new Error("Image provider returned no image data.");
  const bytes = Uint8Array.from(Buffer.from(encoded, "base64"));
  if (!bytes.length || bytes.length > maxImageBytes)
    throw new Error("Generated image size is invalid.");
  const png =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  if (!png)
    throw new Error("Image provider returned an unsupported file type.");
  return {
    bytes,
    mimeType: "image/png",
    extension: "png",
    model: config.model,
  };
}
