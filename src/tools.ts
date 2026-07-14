import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { MediaEngineClient } from './client.js';

const VALID_SIZES = ['256x256', '512x512', '1024x1024'] as const;
// Catalog model ids — the live list is served by GET https://api.mcpmediaengine.com/api/models.
// New models are added to the catalog server-side; your wiring never changes.
const VALID_MODELS = ['nano-banana', 'gpt-image-2'] as const;
const VALID_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
const VALID_AUDIO_FORMATS = ['mp3', 'opus', 'aac', 'flac'] as const;
const VALID_CONTENT_TYPES = ['blog', 'newsletter', 'email', 'social'] as const;
const VALID_PLATFORMS = ['linkedin', 'twitter', 'instagram', 'substack', 'generic'] as const;
const VALID_QUALITY_TIERS = ['basic', 'standard', 'premium'] as const;

const STYLE_PRESETS = ['Cinematic', 'Animated', 'Digital Art', 'Photographic', 'Fantasy art', 'Neonpunk', 'Enhance', 'Comic book', 'Lowpoly', 'Line art'] as const;
const COLOR_GRADING_PRESETS = ['Film Velvia', 'Film Portra', 'Ektar'] as const;
const SCHEDULER_PRESETS = ['euler', 'euler_a', 'dpm++2m_karras', 'dpm++sde_karras', 'dpm++2m', 'dpm++sde', 'lcm', 'tcd'] as const;
const CONTROLNET_PRESETS = ['composition', 'reference', 'segroom', 'ipadapter', 'lineart', 'canny', 'depth', 'mlsd', 'hed', 'pose', 'tile', 'qr'] as const;

const INTENT_IMAGE_SCHEMA = {
  type: 'object' as const,
  properties: {
    title: {
      type: 'string',
      description: 'Title of the article, email, or post. Used to derive visual style and subject.',
    },
    summary: {
      type: 'string',
      description: 'Short summary or body text to guide image composition. If omitted, title alone is used.',
    },
    content_type: {
      type: 'string',
      enum: [...VALID_CONTENT_TYPES],
      description: 'Type of content this image supports (blog, newsletter, email, social). Defaults to blog.',
    },
    tone: {
      type: 'string',
      description: 'Desired emotional tone (e.g. "professional", "playful", "urgent"). Optional.',
    },
    brand_style: {
      type: 'string',
      description: 'Brand aesthetic descriptor (e.g. "minimalist dark", "bold colorful"). Optional.',
    },
    target_platform: {
      type: 'string',
      enum: [...VALID_PLATFORMS],
      description: 'Platform this image targets, used to pick aspect ratio and style conventions.',
    },
    aspect_ratio: {
      type: 'string',
      description: 'Explicit aspect ratio override (e.g. "16:9", "1:1", "4:5"). Optional.',
    },
    reference_images: {
      type: 'array',
      description: 'Optional reference images with roles (e.g. brand logo, style reference).',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL of the reference image.' },
          role: { type: 'string', description: 'Role of this image (e.g. "style", "logo", "subject").' },
        },
        required: ['url'],
      },
    },
    size: {
      type: 'string',
      enum: [...VALID_SIZES],
      description: 'Output image dimensions. Defaults to 1024x1024.',
    },
  },
  required: [],
};

const TOOLS = [
  {
    name: 'generate_article_hero_image',
    description:
      'Generate a hero banner image for a blog post, article, or editorial page. ' +
      'Creates an AI-generated visual from the title and summary — ideal for CMS hero banners, ' +
      'newsletter headers, and article thumbnails. Use this when you need to create a featured image, ' +
      'hero graphic, or cover illustration for written content. Supports brand style hints and reference images.',
    inputSchema: INTENT_IMAGE_SCHEMA,
  },
  {
    name: 'generate_email_header_image',
    description:
      'Create an AI-generated header image for marketing emails and newsletters. ' +
      'Optimised for wide-format email banners (typically 600px wide) from subject line and body text. ' +
      'Accepts tone and brand_style hints to stay on-brand. ' +
      'Returns a queued media job whose result URL can be embedded in the email template. ' +
      'Use this to create email graphics, newsletter banners, or promotional header visuals.',
    inputSchema: INTENT_IMAGE_SCHEMA,
  },
  {
    name: 'generate_social_teaser_image',
    description:
      'Create a social media teaser image optimised for sharing on LinkedIn, Twitter/X, Instagram, or Substack. ' +
      'Auto-selects the best aspect ratio and generates a visual from article or post content. ' +
      'Accepts title, summary, tone, and brand_style. ' +
      'Use this to create social graphics, shareable images, post visuals, or og:image alternatives. ' +
      'Returns a queued media job.',
    inputSchema: INTENT_IMAGE_SCHEMA,
  },
  {
    name: 'generate_article_teaser_video',
    description:
      'Create a short AI-generated teaser video (15–30s) from an article summary or social post. ' +
      'Produces a shareable video for driving traffic from video-first platforms like YouTube Shorts, TikTok, and Instagram Reels. ' +
      'Pass the article title and summary; the tool builds the generation parameters and ' +
      'submits an async video job. Supports tone and brand_style hints.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Article or post title. Required if summary is omitted.',
        },
        summary: {
          type: 'string',
          description: 'Article body or summary to drive scene selection and captions.',
        },
        content_type: {
          type: 'string',
          enum: [...VALID_CONTENT_TYPES],
          description: 'Content category (blog, newsletter, email, social). Defaults to blog.',
        },
        tone: {
          type: 'string',
          description: 'Emotional tone for the video (e.g. "cinematic", "punchy", "calm").',
        },
        brand_style: {
          type: 'string',
          description: 'Visual brand style (e.g. "dark minimal", "vibrant editorial").',
        },
        target_platform: {
          type: 'string',
          enum: [...VALID_PLATFORMS],
          description: 'Destination platform — affects aspect ratio and duration defaults.',
        },
        aspect_ratio: {
          type: 'string',
          description: 'Explicit aspect ratio (e.g. "16:9", "9:16", "1:1"). Optional.',
        },
        provider: {
          type: 'string',
          description: 'Optional video provider override.',
        },
      },
      required: [],
    },
  },
  {
    name: 'generate_article_narration',
    description:
      'Generate audio narration of article or blog post content using text-to-speech. ' +
      'Creates podcast-style audio, accessibility voiceovers, and audio newsletters from written text. ' +
      'Pass the article title and body text; the tool selects an appropriate voice and ' +
      'submits an async audio job. Returns a job ID to poll for the finished audio file.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Article title. Prepended to the narration if provided.',
        },
        text: {
          type: 'string',
          description: 'Full article body to narrate (max 4096 characters).',
          maxLength: 4096,
        },
        voice: {
          type: 'string',
          enum: [...VALID_VOICES],
          description: 'Narration voice (default: nova — warm and clear for long-form).',
        },
        format: {
          type: 'string',
          enum: [...VALID_AUDIO_FORMATS],
          description: 'Output format (default: mp3).',
        },
        speed: {
          type: 'number',
          minimum: 0.25,
          maximum: 4.0,
          description: 'Playback speed multiplier 0.25–4.0 (default: 1.0).',
        },
      },
      required: [],
    },
  },
  {
    name: 'generate_image',
    description:
      'Generate an image from a text prompt using the MediaEngine model catalog. ' +
      'Use this for any image creation request: illustrations, photos, AI art, logos, icons, graphics, or visuals. ' +
      'Accepts a raw prompt and optional aspect ratio, quality tier, model id, and advanced style parameters. ' +
      'Quality tiers: basic/standard (Nano Banana — fast, inexpensive default), premium (GPT-Image — strongest prompt adherence and clean text rendering). ' +
      'One integration, every model: new models are added to the catalog server-side, so the same wiring keeps working. ' +
      'Style guidance: put the desired look in the prompt itself (e.g. "black and white archival photograph", "flat vector illustration") and bake negatives into the prompt ("no text, no words, no logos"). ' +
      'Use the intent-specific tools (generate_article_hero_image, etc.) when you know the content type.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        prompt: {
          type: 'string',
          description: 'Text description of the image to generate. Include the desired style in the prompt (e.g. "photorealistic", "watercolor", "pencil sketch") and constraints like "no text, no words, no logos".',
        },
        aspect_ratio: {
          type: 'string',
          enum: ['1:1', '16:9', '9:16', '21:9', '9:21', '3:2', '2:3', '5:4', '4:5', '4:3', '3:4'],
          description: 'Output aspect ratio (default: 1:1).',
        },
        size: {
          type: 'string',
          enum: [...VALID_SIZES],
          description: 'Legacy size hint; prefer aspect_ratio.',
        },
        quality: {
          type: 'string',
          enum: [...VALID_QUALITY_TIERS],
          description: 'Quality tier: basic/standard (Nano Banana — fast default), premium (GPT-Image — text rendering, strict adherence) (default: standard).',
        },
        model: {
          type: 'string',
          enum: [...VALID_MODELS],
          description: 'Catalog model id (see https://mcpmediaengine.com/models). Overrides quality tier. Default: nano-banana.',
        },
        style_preset: {
          type: 'string',
          enum: [...STYLE_PRESETS],
          description: 'Optional style preset (default image model).',
        },
        color_grading: {
          type: 'string',
          enum: [...COLOR_GRADING_PRESETS],
          description: 'Optional color grading preset (default image model).',
        },
        film_grain: {
          type: 'boolean',
          description: 'Add film grain effect (default image model).',
        },
        face_swap: {
          type: 'boolean',
          description: 'Use face swap with reference images (default image model).',
        },
        inpaint_faces: {
          type: 'boolean',
          description: 'Inpaint faces for better quality (default image model, requires super_resolution).',
        },
        face_correct: {
          type: 'boolean',
          description: 'Apply face correction (default image model).',
        },
        scheduler: {
          type: 'string',
          enum: [...SCHEDULER_PRESETS],
          description: 'Advanced: sampler/scheduler algorithm (default image model).',
        },
        hires_fix: {
          type: 'boolean',
          description: 'High-resolution fix with super_resolution (default image model).',
        },
        controlnet: {
          type: 'string',
          enum: [...CONTROLNET_PRESETS],
          description: 'Advanced: structural conditioning mode (default image model).',
        },
        mask_image_url: {
          type: 'string',
          description: 'URL of mask image for inpainting (default image model).',
        },
        controlnet_conditioning_scale: {
          type: 'number',
          minimum: 0.0,
          maximum: 1.0,
          description: 'Conditioning scale 0.0-1.0 (default image model).',
        },
        controlnet_txt2img: {
          type: 'boolean',
          description: 'Use structural conditioning for txt2img (default image model).',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'generate_audio',
    description:
      'Generate audio from text using text-to-speech (TTS) synthesis. ' +
      'Create voiceovers, narrations, podcast audio, or any spoken audio from text input. ' +
      'Supports multiple voices (alloy, echo, fable, onyx, nova, shimmer), formats (MP3, FLAC, AAC, Opus), and playback speeds. ' +
      'Use the intent-specific generate_article_narration tool for article content.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: {
          type: 'string',
          description: 'Text to synthesize into audio (max 4096 characters).',
          maxLength: 4096,
        },
        voice: {
          type: 'string',
          enum: [...VALID_VOICES],
          description: 'Voice to use for synthesis (default: nova).',
        },
        format: {
          type: 'string',
          enum: [...VALID_AUDIO_FORMATS],
          description: 'Output audio format (default: mp3).',
        },
        speed: {
          type: 'number',
          minimum: 0.25,
          maximum: 4.0,
          description: 'Playback speed multiplier, 0.25–4.0 (default: 1.0).',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'generate_video',
    description:
      'Generate a video using AI video generation. ' +
      'Use this for any video creation request when the intent-specific video tools do not fit. ' +
      'Accepts provider-specific generation parameters directly.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        inputParams: {
          type: 'object',
          description: 'Provider-specific generation parameters.',
          additionalProperties: true,
        },
        provider: {
          type: 'string',
          description: 'Optional provider name.',
        },
      },
      required: ['inputParams'],
    },
  },
  {
    name: 'wait_for_job',
    description:
      'Wait for a media generation job to complete — polls until the image, video, or audio is ready or the timeout is reached. ' +
      'Use this to get the final result without manually calling get_job_status in a loop. ' +
      'Returns the completed job on success or an error if the timeout expires.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        jobId: {
          type: 'string',
          description: 'The media job ID to wait for (e.g. "mjob_...").',
        },
        timeoutSeconds: {
          type: 'number',
          description: 'Maximum seconds to wait before giving up (default: 300).',
          minimum: 1,
          maximum: 600,
        },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'get_job_status',
    description: 'Get the status and result of a media job by its ID.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        jobId: {
          type: 'string',
          description: 'The media job ID (e.g. "mjob_...").',
        },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'list_jobs',
    description: 'List media jobs with optional filtering, sorting, and cursor-based pagination.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cursor: { type: 'string', description: 'Opaque cursor returned by a previous list_jobs call for pagination.' },
        limit: { type: 'number', description: 'Max items to return, 1–100 (default: 20).' },
        page: { type: 'number', description: 'Page number for offset-based pagination (1-indexed).' },
        pageSize: { type: 'number', description: 'Items per page for offset-based pagination (default: 20).' },
        status: {
          type: 'string',
          enum: ['queued', 'processing', 'done', 'failed'],
          description: 'Filter by job status.',
        },
        type: {
          type: 'string',
          enum: ['image', 'audio', 'video'],
          description: 'Filter by media type.',
        },
        createdAfter: { type: 'string', description: 'ISO 8601 datetime — return jobs created after this time.' },
        createdBefore: { type: 'string', description: 'ISO 8601 datetime — return jobs created before this time.' },
        sort: {
          type: 'string',
          enum: ['createdAt', 'completedAt'],
          description: 'Field to sort by (default: createdAt).',
        },
        order: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort direction (default: desc).',
        },
      },
      required: [],
    },
  },
];

function buildImagePrompt(
  toolName: string,
  input: Record<string, unknown>,
): string {
  const title = (input['title'] as string | undefined) ?? '';
  const summary = (input['summary'] as string | undefined) ?? '';
  const tone = (input['tone'] as string | undefined) ?? '';
  const brandStyle = (input['brand_style'] as string | undefined) ?? '';
  const contentType = (input['content_type'] as string | undefined) ?? 'blog';
  const platform = (input['target_platform'] as string | undefined) ?? '';

  const purposeMap: Record<string, string> = {
    generate_article_hero_image: 'hero banner image for a blog article',
    generate_email_header_image: 'header image for a marketing email',
    generate_social_teaser_image: `social media teaser image${platform ? ` for ${platform}` : ''}`,
  };
  const purpose = purposeMap[toolName] ?? 'promotional image';

  const parts: string[] = [`A ${purpose}`];
  if (title) parts.push(`titled "${title}"`);
  if (summary) parts.push(`about: ${summary.slice(0, 300)}`);
  if (contentType) parts.push(`content type: ${contentType}`);
  if (tone) parts.push(`tone: ${tone}`);
  if (brandStyle) parts.push(`style: ${brandStyle}`);

  return parts.join('. ') + '.';
}

function resolveImageSize(input: Record<string, unknown>): string {
  const explicit = input['size'] as string | undefined;
  if (explicit && (VALID_SIZES as readonly string[]).includes(explicit)) return explicit;
  return '1024x1024';
}

function buildVideoParams(input: Record<string, unknown>): Record<string, unknown> {
  const title = (input['title'] as string | undefined) ?? '';
  const summary = (input['summary'] as string | undefined) ?? '';
  const tone = (input['tone'] as string | undefined) ?? '';
  const brandStyle = (input['brand_style'] as string | undefined) ?? '';
  const platform = (input['target_platform'] as string | undefined) ?? '';
  const aspectRatio = (input['aspect_ratio'] as string | undefined) ??
    (platform === 'instagram' ? '9:16' : platform === 'twitter' ? '16:9' : '16:9');

  const parts: string[] = ['Short teaser video'];
  if (title) parts.push(`for article: "${title}"`);
  if (summary) parts.push(summary.slice(0, 300));
  if (tone) parts.push(`tone: ${tone}`);
  if (brandStyle) parts.push(`style: ${brandStyle}`);

  return {
    prompt: parts.join('. ') + '.',
    aspect_ratio: aspectRatio,
    duration: 'short',
  };
}

function mapQualityTierToModel(quality: string): string {
  return quality === 'premium' ? 'gpt-image-2' : 'nano-banana';
}

export function registerTools(server: Server, client: MediaEngineClient): void {
  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const input = (args ?? {});

    try {
      let result: unknown;

      switch (name) {
        case 'generate_article_hero_image':
        case 'generate_email_header_image':
        case 'generate_social_teaser_image': {
          const prompt = buildImagePrompt(name, input);
          const size = resolveImageSize(input);
          const imageParams: Record<string, unknown> = { prompt, size };
          const explicitAspect = input['aspect_ratio'] as string | undefined;
          if (explicitAspect !== undefined) imageParams['aspect_ratio'] = explicitAspect;
          result = await client.createJob('image', imageParams, undefined, 'nano-banana');
          break;
        }

        case 'generate_article_teaser_video': {
          const videoParams = buildVideoParams(input);
          const provider = input['provider'] as string | undefined;
          result = await client.createJob('video', videoParams, provider);
          break;
        }

        case 'generate_article_narration': {
          const rawText = (input['text'] as string | undefined) ?? '';
          const title = (input['title'] as string | undefined) ?? '';
          const text = title ? `${title}.\n\n${rawText}`.trim() : rawText;

          if (!text) {
            return { isError: true, content: [{ type: 'text' as const, text: 'Error: title or text is required' }] };
          }
          if (text.length > 4096) {
            return { isError: true, content: [{ type: 'text' as const, text: 'Error: combined title + text must not exceed 4096 characters' }] };
          }

          const voice = (input['voice'] as string | undefined) ?? 'nova';
          const format = (input['format'] as string | undefined) ?? 'mp3';
          const speed = (input['speed'] as number | undefined) ?? 1.0;

          if (!(VALID_VOICES as readonly string[]).includes(voice)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: voice must be one of ${VALID_VOICES.join(', ')}` }] };
          }
          if (!(VALID_AUDIO_FORMATS as readonly string[]).includes(format)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: format must be one of ${VALID_AUDIO_FORMATS.join(', ')}` }] };
          }
          if (typeof speed !== 'number' || speed < 0.25 || speed > 4.0) {
            return { isError: true, content: [{ type: 'text' as const, text: 'Error: speed must be a number between 0.25 and 4.0' }] };
          }

          result = await client.createJob('audio', { text, voice, format, speed });
          break;
        }

        case 'generate_image': {
          const prompt = input['prompt'];
          if (typeof prompt !== 'string' || prompt.trim() === '') {
            return { isError: true, content: [{ type: 'text' as const, text: 'Error: prompt is required and must be a non-empty string' }] };
          }
          const size = (input['size'] as string | undefined) ?? '1024x1024';
          const quality = (input['quality'] as string | undefined) ?? 'standard';
          const model = (input['model'] as string | undefined);
          const aspectRatio = input['aspect_ratio'] as string | undefined;

          if (!(VALID_SIZES as readonly string[]).includes(size)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: size must be one of ${VALID_SIZES.join(', ')}` }] };
          }
          if (!(VALID_QUALITY_TIERS as readonly string[]).includes(quality)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: quality must be one of ${VALID_QUALITY_TIERS.join(', ')}` }] };
          }
          if (model !== undefined && !(VALID_MODELS as readonly string[]).includes(model)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: model must be one of ${VALID_MODELS.join(', ')}` }] };
          }

          const stylePreset = input['style_preset'] as string | undefined;
          if (stylePreset !== undefined && !(STYLE_PRESETS as readonly string[]).includes(stylePreset)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: style_preset must be one of ${STYLE_PRESETS.join(', ')}` }] };
          }

          const colorGrading = input['color_grading'] as string | undefined;
          if (colorGrading !== undefined && !(COLOR_GRADING_PRESETS as readonly string[]).includes(colorGrading)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: color_grading must be one of ${COLOR_GRADING_PRESETS.join(', ')}` }] };
          }

          const scheduler = input['scheduler'] as string | undefined;
          if (scheduler !== undefined && !(SCHEDULER_PRESETS as readonly string[]).includes(scheduler)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: scheduler must be one of ${SCHEDULER_PRESETS.join(', ')}` }] };
          }

          const controlnet = input['controlnet'] as string | undefined;
          if (controlnet !== undefined && !(CONTROLNET_PRESETS as readonly string[]).includes(controlnet)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: controlnet must be one of ${CONTROLNET_PRESETS.join(', ')}` }] };
          }

          const controlnetConditioningScale = input['controlnet_conditioning_scale'] as number | undefined;
          if (controlnetConditioningScale !== undefined && (typeof controlnetConditioningScale !== 'number' || controlnetConditioningScale < 0 || controlnetConditioningScale > 1)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: controlnet_conditioning_scale must be a number between 0.0 and 1.0` }] };
          }

          const maskImageUrl = input['mask_image_url'] as string | undefined;
          if (maskImageUrl !== undefined && typeof maskImageUrl !== 'string') {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: mask_image_url must be a string` }] };
          }

          const filmGrain = input['film_grain'] === true || input['film_grain'] === 'true';
          const faceSwap = input['face_swap'] === true || input['face_swap'] === 'true';
          const inpaintFaces = input['inpaint_faces'] === true || input['inpaint_faces'] === 'true';
          const faceCorrect = input['face_correct'] === true || input['face_correct'] === 'true';
          const hiresFix = input['hires_fix'] === true || input['hires_fix'] === 'true';
          const controlnetTxt2img = input['controlnet_txt2img'] === true || input['controlnet_txt2img'] === 'true';

          const resolvedModel = model ?? mapQualityTierToModel(quality);
          const imageParams: Record<string, unknown> = { prompt };
          if (aspectRatio !== undefined) imageParams['aspect_ratio'] = aspectRatio;

          if (resolvedModel === 'gpt-image-2') {
            imageParams['quality'] = quality;
          } else {
            if (stylePreset !== undefined) imageParams['style'] = stylePreset;
            if (colorGrading !== undefined) imageParams['color_grading'] = colorGrading;
            if (filmGrain) imageParams['film_grain'] = true;
            if (faceSwap) imageParams['face_swap'] = true;
            if (inpaintFaces) imageParams['inpaint_faces'] = true;
            if (faceCorrect) imageParams['face_correct'] = true;
            if (scheduler !== undefined) imageParams['scheduler'] = scheduler;
            if (hiresFix) imageParams['hires_fix'] = true;
            if (controlnet !== undefined) imageParams['controlnet'] = controlnet;
            if (maskImageUrl !== undefined) imageParams['mask_image_url'] = maskImageUrl;
            if (controlnetConditioningScale !== undefined) imageParams['controlnet_conditioning_scale'] = controlnetConditioningScale;
            if (controlnetTxt2img) imageParams['controlnet_txt2img'] = true;
          }

          result = await client.createJob('image', imageParams, undefined, resolvedModel);
          break;
        }

        case 'generate_audio': {
          const text = input['text'];
          if (typeof text !== 'string' || text.trim() === '') {
            return { isError: true, content: [{ type: 'text' as const, text: 'Error: text is required and must be a non-empty string' }] };
          }
          if (text.length > 4096) {
            return { isError: true, content: [{ type: 'text' as const, text: 'Error: text must not exceed 4096 characters' }] };
          }
          const voice = (input['voice'] as string | undefined) ?? 'nova';
          const format = (input['format'] as string | undefined) ?? 'mp3';
          const speed = (input['speed'] as number | undefined) ?? 1.0;
          if (!(VALID_VOICES as readonly string[]).includes(voice)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: voice must be one of ${VALID_VOICES.join(', ')}` }] };
          }
          if (!(VALID_AUDIO_FORMATS as readonly string[]).includes(format)) {
            return { isError: true, content: [{ type: 'text' as const, text: `Error: format must be one of ${VALID_AUDIO_FORMATS.join(', ')}` }] };
          }
          if (typeof speed !== 'number' || speed < 0.25 || speed > 4.0) {
            return { isError: true, content: [{ type: 'text' as const, text: 'Error: speed must be a number between 0.25 and 4.0' }] };
          }
          const audioParams: Record<string, unknown> = { text, voice, format, speed };
          result = await client.createJob('audio', audioParams);
          break;
        }

        case 'generate_video':
          result = await client.createJob(
            'video',
            (input['inputParams'] as Record<string, unknown>),
            input['provider'] as string | undefined,
          );
          break;

        case 'wait_for_job': {
          const jobId = input['jobId'];
          if (typeof jobId !== 'string' || jobId.trim() === '') {
            return { isError: true, content: [{ type: 'text' as const, text: 'Error: jobId is required and must be a non-empty string' }] };
          }
          const timeoutSeconds = (input['timeoutSeconds'] as number | undefined) ?? 300;
          result = await client.waitForJob(jobId, timeoutSeconds * 1000);
          break;
        }

        case 'get_job_status': {
          const jobId = input['jobId'];
          if (typeof jobId !== 'string' || jobId.trim() === '') {
            return { isError: true, content: [{ type: 'text' as const, text: 'Error: jobId is required and must be a non-empty string' }] };
          }
          result = await client.getJob(jobId);
          break;
        }

        case 'list_jobs': {
          const params: import('./client.js').JobListParams = {};
          if (input['cursor'] !== undefined) params.cursor = input['cursor'] as string;
          if (input['limit'] !== undefined) params.limit = input['limit'] as number;
          if (input['page'] !== undefined) params.page = input['page'] as number;
          if (input['pageSize'] !== undefined) params.pageSize = input['pageSize'] as number;
          if (input['status'] !== undefined) params.status = input['status'] as string;
          if (input['type'] !== undefined) params.type = input['type'] as string;
          if (input['createdAfter'] !== undefined) params.createdAfter = input['createdAfter'] as string;
          if (input['createdBefore'] !== undefined) params.createdBefore = input['createdBefore'] as string;
          if (input['sort'] !== undefined) params.sort = input['sort'] as 'createdAt' | 'completedAt';
          if (input['order'] !== undefined) params.order = input['order'] as 'asc' | 'desc';
          result = await client.listJobs(params);
          break;
        }

        default:
          return {
            isError: true,
            content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }],
          };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
      };
    }
  });
}
