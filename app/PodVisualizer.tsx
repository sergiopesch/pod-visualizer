"use client";

import {
  type CSSProperties,
  type SVGProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { siSpotify, siX, siYoutube } from "simple-icons";
import { useDropzone } from "react-dropzone";
import {
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Mic2,
  Music2,
  Plus,
  RotateCcw,
  Trash2,
  Type,
  UploadCloud,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type PlatformId = "youtube" | "spotify" | "x";
type AssetKind = "video" | "image" | "audio";

type AssetSpec = {
  id: string;
  name: string;
  kind: AssetKind;
  useCase: string;
  width: number;
  height: number;
  ratio: string;
  exportLabel: string;
  requirements: string[];
};

type PlatformConfig = {
  id: PlatformId;
  name: string;
  shortName: string;
  accent: string;
  accentSoft: string;
  thumbnailSrc: string;
  thumbnailAlt: string;
  sourceUrl: string;
  sourceLabel: string;
  primaryUse: string;
  capabilityTags: string[];
  copyLimit: number;
  titleLimit: number;
  assets: AssetSpec[];
};

type StudioForm = {
  showName: string;
  hostName: string;
  episodeTitle: string;
  guestName: string;
  hook: string;
  thumbnailText: string;
  callToAction: string;
  tone: string;
  primaryColor: string;
  secondaryColor: string;
};

type GeneratedCopy = {
  title: string;
  caption: string;
  hashtags: string[];
  prompt: string;
};

type VisualLayerId =
  | "artwork"
  | "badge"
  | "headline"
  | "title"
  | "hook"
  | "cta"
  | "waveform"
  | "footer";

type VisualLayerState = Record<VisualLayerId, boolean>;

type VisualLayerSpec = {
  id: VisualLayerId;
  label: string;
  description: string;
  kind: "media" | "text" | "system";
};

const SPEC_VERIFIED_AT = "April 28, 2026";

const DEFAULT_FORM: StudioForm = {
  showName: "Sergio Pesch Studio",
  hostName: "Sergio Pesch",
  episodeTitle: "I Built a Podcast Asset Machine in 7 Days",
  guestName: "Creator systems",
  hook: "One recording becomes every YouTube, Spotify, and X asset before the episode goes live.",
  thumbnailText: "3 PLATFORMS",
  callToAction: "Export the pack and publish today.",
  tone: "High Retention",
  primaryColor: "#ffd400",
  secondaryColor: "#31c7d4",
};

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: "youtube",
    name: "YouTube",
    shortName: "YT",
    accent: "#ff0033",
    accentSoft: "#ff6f61",
    thumbnailSrc: "/ai-thumbnails/youtube-podcast-studio.webp",
    thumbnailAlt: "AI-generated YouTube podcast thumbnail studio scene",
    sourceUrl: "https://support.google.com/youtube/answer/1722171?hl=en",
    sourceLabel: "YouTube upload encoding",
    primaryUse: "Search-led episodes, Shorts, and thumbnail testing.",
    capabilityTags: [
      "Long-form master",
      "Shorts cutdown",
      "Custom thumbnail",
      "Podcast playlist art",
    ],
    copyLimit: 5000,
    titleLimit: 100,
    assets: [
      {
        id: "youtube-master",
        name: "Episode Master",
        kind: "video",
        useCase: "Long-form upload",
        width: 1920,
        height: 1080,
        ratio: "16:9",
        exportLabel: "MP4 H.264 + AAC / PNG frame",
        requirements: [
          "MP4 container with moov atom at the front",
          "H.264 progressive scan, high profile, 4:2:0",
          "Upload at original frame rate: 24, 25, 30, 48, 50, or 60 fps",
          "48 kHz AAC-LC, Opus, or Eclipsa audio",
        ],
      },
      {
        id: "youtube-short",
        name: "Shorts Frame",
        kind: "video",
        useCase: "Vertical discovery clip",
        width: 1080,
        height: 1920,
        ratio: "9:16",
        exportLabel: "MP4 / PNG poster",
        requirements: [
          "Keep speaker, captions, and logo inside the center safe area",
          "Use fast visual hook in first 1-2 seconds",
          "Avoid baked-in letterboxing or pillarboxing",
          "Export H.264 with AAC audio",
        ],
      },
      {
        id: "youtube-thumb",
        name: "Thumbnail",
        kind: "image",
        useCase: "Browse and suggested video",
        width: 3840,
        height: 2160,
        ratio: "16:9",
        exportLabel: "JPG/PNG/GIF",
        requirements: [
          "Use 16:9 because it is the most used YouTube preview ratio",
          "Minimum width is 640 px",
          "Desktop thumbnail uploads can be up to 50 MB",
          "Keep text bold, short, and readable at small sizes",
        ],
      },
      {
        id: "youtube-podcast",
        name: "Podcast Playlist Art",
        kind: "image",
        useCase: "YouTube podcast playlist",
        width: 3000,
        height: 3000,
        ratio: "1:1",
        exportLabel: "JPG/PNG",
        requirements: [
          "Use square art for podcast playlists",
          "Keep show identity visible at 64 px",
          "Avoid tiny secondary text",
          "Export an additional compressed JPG for upload workflows",
        ],
      },
    ],
  },
  {
    id: "spotify",
    name: "Spotify",
    shortName: "SP",
    accent: "#1ed760",
    accentSoft: "#b9fbc0",
    thumbnailSrc: "/ai-thumbnails/spotify-podcast-cover.webp",
    thumbnailAlt: "AI-generated Spotify podcast cover studio scene",
    sourceUrl: "https://support.spotify.com/ws/creators/article/video-specs/",
    sourceLabel: "Spotify for Creators video specs",
    primaryUse: "Video podcasts, audio episodes, and square show identity.",
    capabilityTags: [
      "Video podcast",
      "Show cover",
      "Episode cover",
      "Audio-first metadata",
    ],
    copyLimit: 4000,
    titleLimit: 120,
    assets: [
      {
        id: "spotify-video",
        name: "Video Podcast",
        kind: "video",
        useCase: "Spotify native video episode",
        width: 1920,
        height: 1080,
        ratio: "16:9",
        exportLabel: "MP4 recommended",
        requirements: [
          "MP4 recommended; MOV is compatible",
          "1080p or higher resolution recommended",
          "16:9 widescreen recommended",
          "H.264 or H.265 with AAC-LC, PCM, or FLAC audio",
        ],
      },
      {
        id: "spotify-show-cover",
        name: "Show Cover",
        kind: "image",
        useCase: "Main podcast identity",
        width: 3000,
        height: 3000,
        ratio: "1:1",
        exportLabel: "JPG/PNG",
        requirements: [
          "Use a square master for broad podcast directory compatibility",
          "Keep host/show identity clear at small thumbnail sizes",
          "Avoid platform logos and crowded typography",
          "Export a compressed upload version after review",
        ],
      },
      {
        id: "spotify-episode-cover",
        name: "Episode Cover",
        kind: "image",
        useCase: "Episode-specific artwork",
        width: 3000,
        height: 3000,
        ratio: "1:1",
        exportLabel: "JPG/PNG",
        requirements: [
          "Use the same visual system as show art",
          "Make episode-specific title or guest visible",
          "Keep series branding consistent",
          "Spotify-hosted shows can add custom episode art",
        ],
      },
      {
        id: "spotify-audio-card",
        name: "Audio Card",
        kind: "audio",
        useCase: "Audio episode and RSS promo",
        width: 1080,
        height: 1080,
        ratio: "1:1",
        exportLabel: "MP3/M4A/WAV + PNG",
        requirements: [
          "Spotify for Creators supports MP3, M4A, and WAV audio uploads",
          "Audio files need to be mono or stereo",
          "Keep embedded artwork and ID3v2 metadata small for MP3",
          "Use the visual card for episode announcements",
        ],
      },
    ],
  },
  {
    id: "x",
    name: "X",
    shortName: "X",
    accent: "#f8fafc",
    accentSoft: "#31c7d4",
    thumbnailSrc: "/ai-thumbnails/x-podcast-launch-card.webp",
    thumbnailAlt: "AI-generated X podcast launch card studio scene",
    sourceUrl:
      "https://business.x.com/en/help/campaign-setup/creative-ad-specifications",
    sourceLabel: "X creative ad specs",
    primaryUse: "Conversation clips, launch posts, and fast quote cards.",
    capabilityTags: [
      "Vertical video",
      "Square timeline",
      "Quote card",
      "Post copy",
    ],
    copyLimit: 280,
    titleLimit: 70,
    assets: [
      {
        id: "x-vertical",
        name: "Vertical Video",
        kind: "video",
        useCase: "Immersive media viewer",
        width: 1080,
        height: 1920,
        ratio: "9:16",
        exportLabel: "MP4/MOV",
        requirements: [
          "Under 15 seconds recommended; up to 2:20 supported",
          "1080 x 1920 maximum, 720 x 1280 minimum",
          "60 fps maximum",
          "H.264 with AAC LC audio; target 5-10 Mbps",
        ],
      },
      {
        id: "x-square",
        name: "Timeline Square",
        kind: "video",
        useCase: "Feed-first episode clip",
        width: 1200,
        height: 1200,
        ratio: "1:1",
        exportLabel: "MP4/MOV / PNG frame",
        requirements: [
          "Square format carries strong feed presence",
          "Use text overlays or captions because many feeds start muted",
          "Keep headline short enough to survive mobile cropping",
          "Use 29.97 or 30 fps unless source needs higher",
        ],
      },
      {
        id: "x-card",
        name: "Launch Card",
        kind: "image",
        useCase: "Image post or website card",
        width: 1200,
        height: 628,
        ratio: "1.91:1",
        exportLabel: "PNG/JPEG",
        requirements: [
          "PNG and JPEG are recommended",
          "Images should stay under 5 MB",
          "Use one direct CTA",
          "Keep headline under the card truncation risk zone",
        ],
      },
      {
        id: "x-quote",
        name: "Quote Card",
        kind: "image",
        useCase: "Conversation starter",
        width: 1440,
        height: 1800,
        ratio: "4:5",
        exportLabel: "PNG/JPEG",
        requirements: [
          "4:5 is supported in expanded image formats",
          "Use one quote, one face, one CTA",
          "Leave enough edge padding for app chrome",
          "Avoid placing key text at the very bottom",
        ],
      },
    ],
  },
];

const DEFAULT_WAVEFORM = Array.from({ length: 96 }, (_, index) => {
  const wave = Math.sin(index * 0.42) * 0.34 + Math.sin(index * 0.11) * 0.24;
  return Math.min(1, Math.max(0.14, 0.52 + wave));
});

const DEFAULT_VISUAL_LAYERS: VisualLayerState = {
  artwork: true,
  badge: true,
  headline: true,
  title: true,
  hook: true,
  cta: false,
  waveform: true,
  footer: true,
};

const VISUAL_LAYER_SPECS: VisualLayerSpec[] = [
  {
    id: "artwork",
    label: "Artwork",
    description: "Background image and hero media frame",
    kind: "media",
  },
  {
    id: "badge",
    label: "Platform badge",
    description: "Format and platform marker",
    kind: "system",
  },
  {
    id: "headline",
    label: "Thumbnail hook",
    description: "Large visual promise text",
    kind: "text",
  },
  {
    id: "title",
    label: "Episode title",
    description: "Secondary title line",
    kind: "text",
  },
  {
    id: "hook",
    label: "Hook copy",
    description: "Short payoff or setup line",
    kind: "text",
  },
  {
    id: "cta",
    label: "CTA",
    description: "Compact action prompt",
    kind: "text",
  },
  {
    id: "waveform",
    label: "Waveform",
    description: "Audio-driven waveform strip",
    kind: "media",
  },
  {
    id: "footer",
    label: "Footer",
    description: "Show name and dimensions",
    kind: "system",
  },
];

type PackagingPreset = {
  id: string;
  name: string;
  title: string;
  thumbnailText: string;
  hook: string;
  callToAction: string;
  tone: string;
  primaryColor: string;
  secondaryColor: string;
};

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

const TONE_OPTIONS = [
  "High Retention",
  "Direct Promise",
  "Founder Mode",
  "Premium Documentary",
  "Calm Expert",
];

const PACKAGING_PRESETS: PackagingPreset[] = [
  {
    id: "direct-promise",
    name: "Direct promise",
    title: "I Built a Podcast Asset Machine in 7 Days",
    thumbnailText: "3 PLATFORMS",
    hook: "One recording becomes every YouTube, Spotify, and X asset before the episode goes live.",
    callToAction: "Export the pack and publish today.",
    tone: "High Retention",
    primaryColor: "#ffd400",
    secondaryColor: "#31c7d4",
  },
  {
    id: "curiosity",
    name: "Curiosity",
    title: "This Changed My Podcast Workflow",
    thumbnailText: "WAIT...",
    hook: "The hidden bottleneck was not editing. It was packaging the episode for every platform.",
    callToAction: "Review the workflow and test the hook.",
    tone: "Direct Promise",
    primaryColor: "#ff3b8d",
    secondaryColor: "#35f2ff",
  },
  {
    id: "before-after",
    name: "Before / After",
    title: "Before and After My Creator System",
    thumbnailText: "BEFORE / AFTER",
    hook: "The same episode goes from scattered files to a complete launch pack.",
    callToAction: "Compare the pack and export the winner.",
    tone: "Founder Mode",
    primaryColor: "#1ed760",
    secondaryColor: "#ffd400",
  },
  {
    id: "problem-solution",
    name: "Problem / solution",
    title: "The Fastest Way to Stop Losing Clips",
    thumbnailText: "STOP THIS",
    hook: "Most creators lose reach after recording because the next step is too slow.",
    callToAction: "Fix the packaging step before publishing.",
    tone: "Calm Expert",
    primaryColor: "#ff5a3d",
    secondaryColor: "#31c7d4",
  },
];

function styleVars(vars: Record<`--${string}`, string | number>): StyleVars {
  return vars as StyleVars;
}

function px(value: number) {
  return `${Math.round(value * 100) / 100}px`;
}

const PLATFORM_ICONS = {
  youtube: siYoutube,
  spotify: siSpotify,
  x: siX,
} satisfies Record<PlatformId, { title: string; path: string; hex: string }>;

function PlatformIcon({
  id,
  className,
  ...props
}: { id: PlatformId; className?: string } & SVGProps<SVGSVGElement>) {
  const icon = PLATFORM_ICONS[id];

  return (
    <svg
      role="img"
      aria-label={icon.title}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      {...props}
    >
      <path d={icon.path} />
    </svg>
  );
}

function getPlatform(id: PlatformId) {
  return PLATFORM_CONFIGS.find((platform) => platform.id === id) ?? PLATFORM_CONFIGS[0];
}

function ratioLabel(width: number, height: number) {
  return width === height ? "square" : width > height ? "landscape" : "vertical";
}

function getLayerSpec(id: VisualLayerId) {
  return VISUAL_LAYER_SPECS.find((layer) => layer.id === id) ?? VISUAL_LAYER_SPECS[0];
}

function getVisibleLayers(layers?: VisualLayerState) {
  return layers ?? DEFAULT_VISUAL_LAYERS;
}

function buildGeneratedCopy(form: StudioForm, platform: PlatformConfig): GeneratedCopy {
  const title = form.episodeTitle.trim() || "Untitled episode";
  const hook =
    form.hook.trim() ||
    "A sharp conversation about building better creative systems.";
  const showName = form.showName.trim() || "Untitled show";
  const guest = form.guestName.trim();
  const thumbnailText = form.thumbnailText.trim() || "MUST WATCH";
  const cta = form.callToAction.trim() || "Listen to the full episode.";

  if (platform.id === "x") {
    return {
      title: `${title} - ${showName}`,
      caption: `${hook}\n\n${cta}`,
      hashtags: ["#podcast", "#creator", "#video"],
      prompt: `Cut a concise ${form.tone.toLowerCase()} social clip from "${title}" with thumbnail text "${thumbnailText}", one clear quote, burned-in captions, and a direct CTA for X.`,
    };
  }

  if (platform.id === "spotify") {
    return {
      title: guest ? `${title} with ${guest}` : title,
      caption: `${hook}\n\nHosted by ${form.hostName}. ${cta}`,
      hashtags: ["podcast", "video podcast", "conversation"],
      prompt: `Prepare a Spotify video podcast package for "${title}" with square cover text "${thumbnailText}", 16:9 video, episode art, clean audio metadata, and consistent series branding.`,
    };
  }

  return {
    title: guest ? `${title}: ${guest}` : `${title} | ${showName}`,
    caption: `${hook}\n\n${cta}\n\nChapters, clips, and references in the description.`,
    hashtags: ["#Podcast", "#VideoPodcast", "#CreatorTools"],
    prompt: `Create YouTube assets for "${title}" with thumbnail text "${thumbnailText}", a curiosity gap between title and thumbnail, a Shorts cutdown, and podcast playlist art.`,
  };
}

function buildProductionBrief(
  form: StudioForm,
  platform: PlatformConfig,
  copy: GeneratedCopy,
  layers: VisualLayerState = DEFAULT_VISUAL_LAYERS
) {
  return {
    verifiedSpecSnapshot: SPEC_VERIFIED_AT,
    platform: platform.name,
    source: platform.sourceUrl,
    aiThumbnail: {
      src: platform.thumbnailSrc,
      description: platform.thumbnailAlt,
    },
    project: {
      showName: form.showName,
      hostName: form.hostName,
      episodeTitle: form.episodeTitle,
      guestName: form.guestName,
      thumbnailText: form.thumbnailText,
      tone: form.tone,
      colors: [form.primaryColor, form.secondaryColor],
    },
    visualLayers: VISUAL_LAYER_SPECS.map((layer) => ({
      id: layer.id,
      label: layer.label,
      enabled: layers[layer.id],
    })),
    generatedCopy: copy,
    assets: platform.assets.map((asset) => ({
      name: asset.name,
      useCase: asset.useCase,
      kind: asset.kind,
      dimensions: `${asset.width}x${asset.height}`,
      ratio: asset.ratio,
      export: asset.exportLabel,
      requirements: asset.requirements,
    })),
  };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const targetRatio = width / height;
  const imageRatio = image.width / image.height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height
  );
}

function drawFallbackArtwork(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  form: StudioForm,
  platform: PlatformConfig
) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, form.primaryColor);
  gradient.addColorStop(0.52, platform.accentSoft);
  gradient.addColorStop(1, form.secondaryColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#050505";
  const stripeWidth = Math.max(12, width * 0.06);
  for (let stripe = -height; stripe < width + height; stripe += stripeWidth * 2) {
    ctx.save();
    ctx.translate(x + stripe, y);
    ctx.rotate(-Math.PI / 7);
    ctx.fillRect(0, 0, stripeWidth, height * 2.2);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(5, 5, 5, 0.72)";
  roundedRect(ctx, x + width * 0.12, y + height * 0.66, width * 0.76, height * 0.18, 18);
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.font = `800 ${Math.max(18, width * 0.12)}px Inter, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(platform.shortName, x + width / 2, y + height * 0.79);
  ctx.textAlign = "left";
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines) break;
    }
  }

  if (currentLine && lines.length < maxLines) lines.push(currentLine);

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    let lastLine = `${lines[maxLines - 1]}...`;
    while (ctx.measureText(lastLine).width > maxWidth && lastLine.length > 4) {
      lastLine = `${lastLine.slice(0, -4)}...`;
    }
    lines[maxLines - 1] = lastLine;
  }

  return lines;
}

function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  initialSize: number,
  maxLines: number,
  color: string,
  weight = 800
) {
  let fontSize = initialSize;
  let lines: string[] = [];

  while (fontSize >= initialSize * 0.62) {
    ctx.font = `${weight} ${fontSize}px Inter, Arial, sans-serif`;
    lines = wrapLines(ctx, text, maxWidth, maxLines);
    const allWordsFit = text.trim().split(/\s+/).length <= lines.join(" ").split(/\s+/).length;
    if (lines.length <= maxLines && (allWordsFit || lines.length === maxLines)) break;
    fontSize -= 4;
  }

  ctx.fillStyle = color;
  ctx.font = `${weight} ${fontSize}px Inter, Arial, sans-serif`;
  const lineHeight = fontSize * 1.08;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });

  return lines.length * lineHeight;
}

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  peaks: number[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  density: number
) {
  const barCount = Math.max(24, Math.min(density, peaks.length));
  const gap = Math.max(2, width / barCount / 3.8);
  const barWidth = (width - gap * (barCount - 1)) / barCount;
  const step = peaks.length / barCount;

  for (let index = 0; index < barCount; index += 1) {
    const peak = peaks[Math.floor(index * step)] ?? 0.3;
    const barHeight = Math.max(height * 0.12, peak * height);
    const barX = x + index * (barWidth + gap);
    const barY = y + (height - barHeight) / 2;
    ctx.fillStyle = index % 7 === 0 ? "#f8fafc" : color;
    roundedRect(ctx, barX, barY, barWidth, barHeight, barWidth / 2);
    ctx.fill();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load artwork"));
    image.src = src;
  });
}

async function makeAssetCanvas({
  asset,
  platform,
  form,
  copy,
  waveform,
  waveformDensity,
  layers,
  artworkUrl,
}: {
  asset: AssetSpec;
  platform: PlatformConfig;
  form: StudioForm;
  copy: GeneratedCopy;
  waveform: number[];
  waveformDensity: number;
  layers?: VisualLayerState;
  artworkUrl: string | null;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = asset.width;
  canvas.height = asset.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas export is not supported in this browser.");

  const width = asset.width;
  const height = asset.height;
  const minSide = Math.min(width, height);
  const pad = Math.max(28, Math.round(minSide * 0.075));
  const orientation = ratioLabel(width, height);
  const title = copy.title;
  const thumbnailText = form.thumbnailText.trim() || title;
  const subtitle = form.hook;
  const activeLayers = getVisibleLayers(layers);
  const artworkImage = activeLayers.artwork && artworkUrl ? await loadImage(artworkUrl) : null;

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#050505");
  background.addColorStop(0.5, "#151515");
  background.addColorStop(1, "#0b0f0c");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.16;
  ctx.fillStyle = platform.accent;
  ctx.fillRect(0, 0, Math.max(12, width * 0.014), height);
  ctx.fillRect(0, height - Math.max(12, height * 0.014), width, Math.max(12, height * 0.014));
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.18;
  for (let line = 0; line < width; line += Math.max(64, minSide * 0.08)) {
    ctx.strokeStyle = line % 3 === 0 ? form.secondaryColor : "#f8fafc";
    ctx.lineWidth = Math.max(1, minSide * 0.001);
    ctx.beginPath();
    ctx.moveTo(line, 0);
    ctx.lineTo(line - height * 0.45, height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  let artX = pad;
  let artY = pad * 1.25;
  let artWidth = width - pad * 2;
  let artHeight = Math.min(height * 0.34, artWidth * 0.62);

  if (orientation === "landscape") {
    artWidth = Math.min(height * 0.62, width * 0.34);
    artHeight = artWidth;
    artX = width - pad - artWidth;
    artY = pad * 1.8;
  } else if (orientation === "vertical") {
    artWidth = width - pad * 2;
    artHeight = Math.min(height * 0.24, artWidth * 0.54);
    artX = pad;
    artY = pad * 1.08;
  } else if (orientation === "square") {
    artWidth = width - pad * 1.65;
    artHeight = Math.min(height * 0.29, artWidth * 0.48);
    artX = pad;
    artY = pad * 1.05;
  }

  if (activeLayers.artwork) {
    ctx.save();
    roundedRect(ctx, artX, artY, artWidth, artHeight, Math.max(20, minSide * 0.028));
    ctx.clip();
    if (artworkImage) {
      drawCoverImage(ctx, artworkImage, artX, artY, artWidth, artHeight);
      ctx.fillStyle = "rgba(5, 5, 5, 0.34)";
      ctx.fillRect(artX, artY, artWidth, artHeight);
    } else {
      drawFallbackArtwork(ctx, artX, artY, artWidth, artHeight, form, platform);
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(248, 250, 252, 0.26)";
    ctx.lineWidth = Math.max(2, minSide * 0.003);
    roundedRect(ctx, artX, artY, artWidth, artHeight, Math.max(20, minSide * 0.028));
    ctx.stroke();
  }

  const isVertical = orientation === "vertical";
  const isSquare = orientation === "square";
  const pillX = pad;
  const pillY = orientation === "landscape"
    ? pad * 1.55
    : activeLayers.artwork
      ? artY + artHeight + pad * 0.34
      : pad * 1.25;

  if (activeLayers.badge) {
    ctx.fillStyle = "rgba(248, 250, 252, 0.1)";
    roundedRect(ctx, pillX, pillY, Math.min(width * 0.46, 500), minSide * 0.052, minSide * 0.026);
    ctx.fill();
    ctx.fillStyle = platform.accent;
    ctx.font = `800 ${Math.max(18, minSide * 0.022)}px Inter, Arial, sans-serif`;
    ctx.fillText(
      `${platform.name.toUpperCase()}  ${asset.ratio}  ${asset.useCase.toUpperCase()}`,
      pillX + minSide * 0.028,
      pillY + minSide * 0.035
    );
  }

  const textX = pad;
  const waveHeight = isSquare
    ? Math.max(44, minSide * 0.082)
    : Math.max(44, minSide * 0.11);
  const waveY = height - pad - waveHeight;
  const titleY = orientation === "landscape"
    ? activeLayers.badge ? height * 0.36 : pad * 1.8
    : activeLayers.badge ? pillY + minSide * 0.105 : pillY;
  const textMaxWidth =
    orientation === "landscape" && activeLayers.artwork
      ? width - artWidth - pad * 3
      : width - pad * 2;
  const textBottomLimit = activeLayers.waveform
    ? waveY - minSide * (isSquare ? 0.11 : 0.09)
    : height - pad * (activeLayers.footer ? 1.25 : 0.7);
  const availableTextHeight = Math.max(minSide * 0.18, textBottomLimit - titleY);
  const titleSize = orientation === "landscape"
    ? Math.min(104, height * 0.095)
    : Math.min(isSquare ? 118 : 132, width * (isSquare ? 0.085 : 0.105));
  let currentTextY = titleY;

  if (activeLayers.headline) {
    currentTextY += drawTextBlock(
      ctx,
      thumbnailText,
      textX,
      currentTextY,
      textMaxWidth,
      titleSize,
      orientation === "landscape" ? 3 : isSquare ? 2 : 3,
      "#f8fafc"
    );
    currentTextY += minSide * (isSquare ? 0.038 : 0.048);
  }

  const titleMetaSize = Math.max(20, minSide * (isSquare ? 0.026 : 0.032));
  if (activeLayers.title) {
    ctx.font = `600 ${titleMetaSize}px Inter, Arial, sans-serif`;
    ctx.fillStyle = "rgba(248, 250, 252, 0.72)";
    const titleLines = wrapLines(ctx, title, textMaxWidth, activeLayers.headline ? 1 : 2);
    titleLines.forEach((line, index) => {
      ctx.fillText(line, textX, currentTextY + index * titleMetaSize * 1.18);
    });
    currentTextY += titleLines.length * titleMetaSize * 1.28 + minSide * 0.02;
  }

  const subtitleSize = Math.max(18, minSide * (isSquare ? 0.022 : 0.026));
  const subtitleLineHeight = subtitleSize * 1.34;
  const subtitleMaxLines = Math.max(
    0,
    Math.min(
      isVertical ? 3 : 2,
      Math.floor((availableTextHeight - (currentTextY - titleY)) / subtitleLineHeight)
    )
  );
  if (activeLayers.hook && subtitleMaxLines > 0) {
    ctx.font = `500 ${subtitleSize}px Inter, Arial, sans-serif`;
    ctx.fillStyle = "rgba(248, 250, 252, 0.62)";
    const subtitleLines = wrapLines(ctx, subtitle, textMaxWidth, subtitleMaxLines);
    subtitleLines.forEach((line, index) => {
      ctx.fillText(line, textX, currentTextY + index * subtitleLineHeight);
    });
    currentTextY += subtitleLines.length * subtitleLineHeight + minSide * 0.04;
  }

  if (activeLayers.cta) {
    const ctaText = form.callToAction.trim() || "Listen to the full episode";
    const ctaHeight = Math.max(34, minSide * 0.056);
    ctx.font = `800 ${Math.max(16, minSide * 0.022)}px Inter, Arial, sans-serif`;
    const ctaWidth = Math.min(textMaxWidth, Math.max(minSide * 0.34, ctx.measureText(ctaText).width + minSide * 0.08));
    ctx.fillStyle = "rgba(248, 250, 252, 0.1)";
    roundedRect(ctx, textX, currentTextY, ctaWidth, ctaHeight, ctaHeight / 2);
    ctx.fill();
    ctx.fillStyle = form.primaryColor;
    ctx.fillText(ctaText, textX + minSide * 0.04, currentTextY + ctaHeight * 0.64);
  }

  if (activeLayers.waveform) {
    drawWaveform(ctx, waveform, pad, waveY, width - pad * 2, waveHeight, form.primaryColor, waveformDensity);
  }

  if (activeLayers.footer) {
    ctx.fillStyle = "rgba(248, 250, 252, 0.78)";
    ctx.font = `700 ${Math.max(18, minSide * 0.024)}px Inter, Arial, sans-serif`;
    ctx.fillText(form.showName || "Podcast Studio", pad, height - pad * 0.36);

    ctx.textAlign = "right";
    ctx.fillStyle = platform.accentSoft;
    ctx.fillText(`${asset.width}x${asset.height}`, width - pad, height - pad * 0.36);
    ctx.textAlign = "left";
  }

  return canvas;
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = filename;
  anchor.click();
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function sanitizeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function assetFilename(form: StudioForm, platform: PlatformConfig, asset: AssetSpec) {
  return `${sanitizeFilename(form.episodeTitle || "podcast")}-${platform.id}-${asset.id}.png`;
}

async function makeContactSheetCanvas({
  platform,
  form,
  copy,
  waveform,
  waveformDensity,
  layers,
  artworkUrl,
}: {
  platform: PlatformConfig;
  form: StudioForm;
  copy: GeneratedCopy;
  waveform: number[];
  waveformDensity: number;
  layers?: VisualLayerState;
  artworkUrl: string | null;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 2400;
  canvas.height = 1600;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas export is not supported in this browser.");

  const width = canvas.width;
  const height = canvas.height;
  const margin = 96;
  const gap = 44;
  const headerHeight = 188;
  const footerHeight = 58;
  const cellWidth = (width - margin * 2 - gap) / 2;
  const cellHeight = (height - margin - headerHeight - footerHeight - gap) / 2;

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#050505");
  background.addColorStop(0.48, "#111111");
  background.addColorStop(1, "#07100b");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.16;
  ctx.fillStyle = platform.accent;
  ctx.fillRect(0, 0, 34, height);
  ctx.fillRect(0, height - 28, width, 28);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#f8fafc";
  ctx.font = "900 74px Inter, Arial, sans-serif";
  ctx.fillText(`${platform.name} Pack Review`, margin, margin + 64);

  ctx.fillStyle = "rgba(248, 250, 252, 0.66)";
  ctx.font = "600 31px Inter, Arial, sans-serif";
  ctx.fillText(copy.title, margin, margin + 116);

  ctx.textAlign = "right";
  ctx.fillStyle = platform.accentSoft;
  ctx.font = "900 34px Inter, Arial, sans-serif";
  ctx.fillText(`${platform.assets.length} export-ready assets`, width - margin, margin + 64);
  ctx.fillStyle = "rgba(248, 250, 252, 0.58)";
  ctx.font = "700 23px Inter, Arial, sans-serif";
  ctx.fillText(SPEC_VERIFIED_AT, width - margin, margin + 112);
  ctx.textAlign = "left";

  for (const [index, asset] of platform.assets.entries()) {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + column * (cellWidth + gap);
    const y = headerHeight + row * (cellHeight + gap);

    ctx.fillStyle = "rgba(248, 250, 252, 0.055)";
    roundedRect(ctx, x, y, cellWidth, cellHeight, 26);
    ctx.fill();
    ctx.strokeStyle = "rgba(248, 250, 252, 0.14)";
    ctx.lineWidth = 2;
    roundedRect(ctx, x, y, cellWidth, cellHeight, 26);
    ctx.stroke();

    const previewX = x + 34;
    const previewY = y + 34;
    const previewWidth = cellWidth - 68;
    const previewHeight = cellHeight - 138;
    const assetCanvas = await makeAssetCanvas({
      asset,
      platform,
      form,
      copy,
      waveform,
      waveformDensity,
      layers,
      artworkUrl,
    });
    const assetRatio = asset.width / asset.height;
    let drawWidth = previewWidth;
    let drawHeight = drawWidth / assetRatio;

    if (drawHeight > previewHeight) {
      drawHeight = previewHeight;
      drawWidth = drawHeight * assetRatio;
    }

    const drawX = previewX + (previewWidth - drawWidth) / 2;
    const drawY = previewY + (previewHeight - drawHeight) / 2;
    ctx.save();
    roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, 18);
    ctx.clip();
    ctx.drawImage(assetCanvas, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
    ctx.strokeStyle = "rgba(248, 250, 252, 0.28)";
    roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, 18);
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "900 32px Inter, Arial, sans-serif";
    ctx.fillText(asset.name, x + 34, y + cellHeight - 72);
    ctx.fillStyle = "rgba(248, 250, 252, 0.58)";
    ctx.font = "700 22px Inter, Arial, sans-serif";
    ctx.fillText(`${asset.width}x${asset.height} / ${asset.ratio}`, x + 34, y + cellHeight - 34);
    ctx.textAlign = "right";
    ctx.fillText(assetFilename(form, platform, asset), x + cellWidth - 34, y + cellHeight - 34);
    ctx.textAlign = "left";
  }

  ctx.fillStyle = "rgba(248, 250, 252, 0.54)";
  ctx.font = "700 22px Inter, Arial, sans-serif";
  ctx.fillText(form.showName || "Podcast Asset Studio", margin, height - margin * 0.42);
  ctx.textAlign = "right";
  ctx.fillText("YouTube / Spotify / X creator asset suite", width - margin, height - margin * 0.42);
  ctx.textAlign = "left";

  return canvas;
}

export function PodVisualizer() {
  const [selectedPlatformId, setSelectedPlatformId] = useState<PlatformId>("spotify");
  const [selectedAssetId, setSelectedAssetId] = useState("spotify-video");
  const [form, setForm] = useState<StudioForm>(DEFAULT_FORM);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [waveform, setWaveform] = useState(DEFAULT_WAVEFORM);
  const [waveformDensity, setWaveformDensity] = useState(72);
  const [visualLayers, setVisualLayers] = useState<VisualLayerState>(DEFAULT_VISUAL_LAYERS);
  const [selectedLayerId, setSelectedLayerId] = useState<VisualLayerId>("headline");
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ready to create the first asset pack.");

  const platform = useMemo(() => getPlatform(selectedPlatformId), [selectedPlatformId]);
  const selectedAsset = useMemo(
    () =>
      platform.assets.find((asset) => asset.id === selectedAssetId) ??
      platform.assets[0],
    [platform.assets, selectedAssetId]
  );
  const generatedCopy = useMemo(
    () => buildGeneratedCopy(form, platform),
    [form, platform]
  );
  const productionBrief = useMemo(
    () => buildProductionBrief(form, platform, generatedCopy, visualLayers),
    [form, generatedCopy, platform, visualLayers]
  );
  const customArtworkUrl = artworkFile && artworkUrl ? artworkUrl : null;
  const activeArtworkUrl = customArtworkUrl ?? platform.thumbnailSrc;
  const selectedLayer = getLayerSpec(selectedLayerId);
  const activeLayerCount = VISUAL_LAYER_SPECS.filter((layer) => visualLayers[layer.id]).length;
  const hiddenLayerCount = VISUAL_LAYER_SPECS.length - activeLayerCount;

  useEffect(() => {
    if (!artworkFile) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setArtworkUrl(String(reader.result));
      setStatusMessage(`Artwork loaded from ${artworkFile.name}.`);
    };
    reader.readAsDataURL(artworkFile);
  }, [artworkFile]);

  useEffect(() => {
    let cancelled = false;

    async function decodeAudio() {
      if (!audioFile) {
        setWaveform(DEFAULT_WAVEFORM);
        return;
      }

      try {
        setStatusMessage(`Audio received from ${audioFile.name}. Decoding waveform...`);
        const AudioContextClass =
          window.AudioContext ||
          (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;

        if (!AudioContextClass) {
          setWaveform(DEFAULT_WAVEFORM);
          return;
        }

        const audioContext = new AudioContextClass();
        const buffer = await audioFile.arrayBuffer();
        const decoded = await audioContext.decodeAudioData(buffer.slice(0));
        const channel = decoded.getChannelData(0);
        const samples = 96;
        const blockSize = Math.max(1, Math.floor(channel.length / samples));
        const peaks = Array.from({ length: samples }, (_, sampleIndex) => {
          let peak = 0;
          const start = sampleIndex * blockSize;
          const end = Math.min(start + blockSize, channel.length);

          for (let index = start; index < end; index += Math.max(1, Math.floor(blockSize / 80))) {
            peak = Math.max(peak, Math.abs(channel[index] ?? 0));
          }

          return Math.min(1, Math.max(0.08, peak * 1.8));
        });

        await audioContext.close();
        if (!cancelled) {
          setWaveform(peaks);
          setStatusMessage(`Waveform loaded from ${audioFile.name}.`);
        }
      } catch {
        if (!cancelled) {
          setWaveform(DEFAULT_WAVEFORM);
          setStatusMessage("Audio waveform could not be decoded, so the studio fallback is active.");
        }
      }
    }

    void decodeAudio();

    return () => {
      cancelled = true;
    };
  }, [audioFile]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const image = acceptedFiles.find((file) => file.type.startsWith("image/"));
    const audio = acceptedFiles.find((file) => file.type.startsWith("audio/"));

    if (image) setArtworkFile(image);
    if (audio) setAudioFile(audio);
    if (image || audio) {
      setStatusMessage("Media received. The preview and asset pack are updated.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".ogg"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: true,
    noClick: true,
  });

  const setFormValue = <Key extends keyof StudioForm>(
    key: Key,
    value: StudioForm[Key]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const selectPlatform = (nextPlatformId: PlatformId) => {
    const nextPlatform = getPlatform(nextPlatformId);
    setSelectedPlatformId(nextPlatformId);
    setSelectedAssetId(nextPlatform.assets[0]?.id ?? selectedAssetId);
    setStatusMessage(`${nextPlatform.name} workspace selected.`);
  };

  const setLayerVisibility = (layerId: VisualLayerId, isVisible: boolean) => {
    setVisualLayers((current) => ({ ...current, [layerId]: isVisible }));
    setSelectedLayerId(layerId);
    setStatusMessage(
      `${getLayerSpec(layerId).label} ${isVisible ? "added to" : "removed from"} the visual.`
    );
  };

  const resetLayers = () => {
    setVisualLayers(DEFAULT_VISUAL_LAYERS);
    setSelectedLayerId("headline");
    setStatusMessage("Default visual layers restored.");
  };

  const applyPackagingPreset = (preset: PackagingPreset) => {
    setForm((current) => ({
      ...current,
      episodeTitle: preset.title,
      hook: preset.hook,
      thumbnailText: preset.thumbnailText,
      callToAction: preset.callToAction,
      tone: preset.tone,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
    }));
    setStatusMessage(`${preset.name} packaging applied.`);
  };

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatusMessage(`${label} copied.`);
    } catch {
      setStatusMessage(`${label} is ready to select and copy.`);
    }
  };

  const exportSelectedAsset = async (asset = selectedAsset, targetPlatform = platform) => {
    setIsExporting(true);
    setStatusMessage(`Rendering ${asset.name}...`);

    try {
      const copy = buildGeneratedCopy(form, targetPlatform);
      const canvas = await makeAssetCanvas({
        asset,
        platform: targetPlatform,
        form,
        copy,
        waveform,
        waveformDensity,
        layers: visualLayers,
        artworkUrl: customArtworkUrl ?? targetPlatform.thumbnailSrc,
      });
      const filename = assetFilename(form, targetPlatform, asset);
      downloadCanvas(canvas, filename);
      setStatusMessage(`${asset.name} exported as PNG.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportPlatformPack = async () => {
    setIsExporting(true);
    setStatusMessage(`Rendering ${platform.name} pack...`);

    try {
      for (const asset of platform.assets) {
        const canvas = await makeAssetCanvas({
          asset,
          platform,
          form,
          copy: generatedCopy,
          waveform,
          waveformDensity,
          layers: visualLayers,
          artworkUrl: activeArtworkUrl,
        });
        const filename = assetFilename(form, platform, asset);
        downloadCanvas(canvas, filename);
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }

      setStatusMessage(`${platform.name} visual pack exported.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Pack export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportContactSheet = async () => {
    setIsExporting(true);
    setStatusMessage(`Rendering ${platform.name} contact sheet...`);

    try {
      const canvas = await makeContactSheetCanvas({
        platform,
        form,
        copy: generatedCopy,
        waveform,
        waveformDensity,
        layers: visualLayers,
        artworkUrl: activeArtworkUrl,
      });
      downloadCanvas(
        canvas,
        `${sanitizeFilename(form.episodeTitle || "podcast")}-${platform.id}-contact-sheet.png`
      );
      setStatusMessage(`${platform.name} contact sheet exported.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Contact sheet export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(productionBrief, null, 2));
      setStatusMessage("Production brief copied to clipboard.");
    } catch {
      downloadJson(productionBrief, `${sanitizeFilename(form.episodeTitle || "podcast")}-${platform.id}-brief.json`);
      setStatusMessage("Clipboard unavailable, so the JSON brief was downloaded.");
    }
  };

  const checks = [
    {
      label: "Thumbnail is a 1-4 word visual hook",
      passed: form.thumbnailText.trim().split(/\s+/).filter(Boolean).length <= 4,
    },
    {
      label: "Title and thumbnail do different jobs",
      passed: !generatedCopy.title
        .toLowerCase()
        .includes(form.thumbnailText.trim().toLowerCase()),
    },
    {
      label: "Hook pays off the click fast",
      passed: form.hook.trim().length >= 32,
    },
    {
      label: "Platform preset selected",
      passed: Boolean(platform),
    },
    {
      label: "Title is within the platform-safe range",
      passed: generatedCopy.title.length <= platform.titleLimit,
    },
    {
      label: "Caption copy is within practical limit",
      passed: generatedCopy.caption.length <= platform.copyLimit,
    },
    {
      label: artworkFile ? "Custom artwork loaded" : "AI thumbnail background active",
      passed: true,
    },
    {
      label: audioFile ? "Source audio waveform layer active" : "Fallback waveform layer active",
      passed: visualLayers.waveform,
    },
    {
      label: `${activeLayerCount} visual layers active`,
      passed: visualLayers.headline || visualLayers.title || visualLayers.artwork,
    },
  ];

  const readinessScore = Math.round(
    (checks.filter((check) => check.passed).length / checks.length) * 100
  );
  const orientation = ratioLabel(selectedAsset.width, selectedAsset.height);
  const dropRootProps = getRootProps();
  const previewVars = styleVars({
    "--preview-ratio": `${selectedAsset.width} / ${selectedAsset.height}`,
    "--studio-primary": form.primaryColor,
    "--studio-secondary": form.secondaryColor,
    "--studio-accent": platform.accent,
    "--studio-accent-soft": platform.accentSoft,
    "--ready-width": `${readinessScore}%`,
  });

  return (
    <main
      {...dropRootProps}
      className={cn(
        "min-h-screen overflow-x-hidden bg-[#050505] text-zinc-50 outline-hidden",
        isDragActive && "cursor-copy"
      )}
    >
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-black/75 p-6 backdrop-blur-xs">
          <div className="rounded-md border border-[#1ed760] bg-[#0c0c0c] px-6 py-5 text-center shadow-2xl">
            <UploadCloud className="mx-auto h-8 w-8 text-[#1ed760]" />
            <p className="mt-3 text-lg font-black">Drop media anywhere</p>
            <p className="mt-1 text-sm text-zinc-400">Artwork updates the frame. Audio updates the waveform.</p>
          </div>
        </div>
      )}
      <div className="mx-auto flex min-h-screen w-full max-w-[min(1720px,100vw)] flex-col overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050505]/95 py-3 backdrop-blur">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                Podcast Asset Studio
              </p>
              <h1 className="truncate text-xl font-black leading-tight sm:text-2xl">
                {form.episodeTitle || "Untitled episode"}
              </h1>
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="flex rounded-md border border-white/10 bg-white/[0.035] p-1">
                {PLATFORM_CONFIGS.map((item) => {
                  const isSelected = item.id === selectedPlatformId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectPlatform(item.id)}
                      aria-label={`Select ${item.name}`}
                      title={item.primaryUse}
                      className={cn(
                        "inline-flex h-10 w-12 items-center justify-center rounded-sm text-zinc-400 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1ed760]",
                        isSelected && "bg-white text-black"
                      )}
                    >
                      <PlatformIcon id={item.id} className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>

              <Select value={selectedAsset.id} onValueChange={setSelectedAssetId}>
                <SelectTrigger className="min-w-[220px] border-white/10 bg-white/[0.035] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platform.assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} / {asset.ratio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={open}
                  className="border-white/10 bg-transparent text-white hover:bg-white/8 hover:text-white"
                >
                  <UploadCloud className="h-4 w-4" />
                  Media
                </Button>
                <Button
                  type="button"
                  onClick={() => void exportSelectedAsset()}
                  disabled={isExporting}
                  className="bg-white text-black hover:bg-[#1ed760]"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid w-full max-w-[calc(100vw-2rem)] flex-1 gap-4 pt-4 sm:max-w-none xl:grid-cols-[320px_minmax(520px,1fr)_340px]">
          <aside className="order-2 min-w-0 space-y-3 rounded-md border border-white/10 bg-[#0a0a0a] p-3 xl:order-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Inputs
                </p>
                <h2 className="mt-1 text-xl font-black">Episode source</h2>
              </div>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={open}
                title="Upload source media"
                className="bg-white text-black hover:bg-[#1ed760]"
              >
                <UploadCloud className="h-4 w-4" />
              </Button>
            </div>

            <button
              type="button"
              onClick={open}
              className={cn(
                "w-full text-left",
                "rounded-md border border-dashed p-4 transition",
                isDragActive
                  ? "border-[#1ed760] bg-[#1ed760]/10"
                  : "border-white/15 bg-white/[0.035]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/6">
                  <UploadCloud className="h-5 w-5 text-[#1ed760]" />
                </div>
                <div>
                  <p className="text-sm font-bold">
                    Drop anywhere or click to upload.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Artwork drives the frame. Audio drives the waveform.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-zinc-500" />
                  <span>{artworkFile?.name ?? "No custom artwork loaded"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic2 className="h-4 w-4 text-zinc-500" />
                  <span>{audioFile?.name ?? "No audio waveform loaded"}</span>
                </div>
              </div>
            </button>

            <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Click editor
                  </p>
                  <h3 className="mt-1 flex items-center gap-2 font-black">
                    <Layers className="h-4 w-4 text-[#1ed760]" />
                    Visual layers
                  </h3>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={resetLayers}
                  title="Restore default layers"
                  className="h-9 w-9 border-white/10 bg-transparent text-white hover:bg-white/8 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 grid gap-2">
                {VISUAL_LAYER_SPECS.map((layer) => {
                  const isVisible = visualLayers[layer.id];
                  const isSelected = selectedLayerId === layer.id;

                  return (
                    <div
                      key={layer.id}
                      className={cn(
                        "grid grid-cols-[1fr_auto] items-center gap-2 rounded-md border p-2 transition",
                        isSelected
                          ? "border-[#1ed760]/60 bg-[#1ed760]/10"
                          : "border-white/10 bg-black/20"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedLayerId(layer.id)}
                        className="min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2">
                          {layer.kind === "text" ? (
                            <Type className="h-3.5 w-3.5 text-zinc-500" />
                          ) : layer.kind === "media" ? (
                            <ImageIcon className="h-3.5 w-3.5 text-zinc-500" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 text-zinc-500" />
                          )}
                          <span className="truncate text-sm font-bold text-zinc-100">
                            {layer.label}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {layer.description}
                        </p>
                      </button>
                      <Button
                        type="button"
                        size="icon"
                        variant={isVisible ? "outline" : "secondary"}
                        onClick={() => setLayerVisibility(layer.id, !isVisible)}
                        title={isVisible ? `Remove ${layer.label}` : `Add ${layer.label}`}
                        className={cn(
                          "h-9 w-9",
                          isVisible
                            ? "border-white/10 bg-transparent text-white hover:bg-red-500/15 hover:text-white"
                            : "bg-white text-black hover:bg-[#1ed760]"
                        )}
                      >
                        {isVisible ? <Trash2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 rounded-md border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{selectedLayer.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {visualLayers[selectedLayerId] ? "Active on canvas" : "Removed from canvas"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={visualLayers[selectedLayerId] ? "outline" : "secondary"}
                    onClick={() => setLayerVisibility(selectedLayerId, !visualLayers[selectedLayerId])}
                    className={cn(
                      visualLayers[selectedLayerId]
                        ? "border-white/10 bg-transparent text-white hover:bg-white/8 hover:text-white"
                        : "bg-white text-black hover:bg-[#1ed760]"
                    )}
                  >
                    {visualLayers[selectedLayerId] ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Remove
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add
                      </>
                    )}
                  </Button>
                </div>

                {selectedLayerId === "headline" && (
                  <Input
                    value={form.thumbnailText}
                    onChange={(event) => setFormValue("thumbnailText", event.target.value)}
                    className="mt-3 border-white/10 bg-white/4 text-white"
                  />
                )}
                {selectedLayerId === "title" && (
                  <Input
                    value={form.episodeTitle}
                    onChange={(event) => setFormValue("episodeTitle", event.target.value)}
                    className="mt-3 border-white/10 bg-white/4 text-white"
                  />
                )}
                {selectedLayerId === "hook" && (
                  <textarea
                    value={form.hook}
                    onChange={(event) => setFormValue("hook", event.target.value)}
                    rows={3}
                    className="mt-3 min-h-20 w-full resize-none rounded-md border border-white/10 bg-white/4 px-3 py-2 text-sm text-white outline-hidden ring-offset-background placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-[#1ed760]"
                  />
                )}
                {selectedLayerId === "cta" && (
                  <Input
                    value={form.callToAction}
                    onChange={(event) => setFormValue("callToAction", event.target.value)}
                    className="mt-3 border-white/10 bg-white/4 text-white"
                  />
                )}
                {selectedLayerId === "footer" && (
                  <Input
                    value={form.showName}
                    onChange={(event) => setFormValue("showName", event.target.value)}
                    className="mt-3 border-white/10 bg-white/4 text-white"
                  />
                )}
                {selectedLayerId === "waveform" && (
                  <div className="mt-3 grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Density</Label>
                      <span className="text-xs text-zinc-500">{waveformDensity}</span>
                    </div>
                    <Slider
                      min={24}
                      max={96}
                      step={6}
                      value={[waveformDensity]}
                      onValueChange={(value) => setWaveformDensity(value[0] ?? 72)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={open}
                      className="bg-white text-black hover:bg-[#1ed760]"
                    >
                      <Mic2 className="h-4 w-4" />
                      Replace audio
                    </Button>
                  </div>
                )}
                {selectedLayerId === "artwork" && (
                  <div className="mt-3 grid gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={open}
                      className="bg-white text-black hover:bg-[#1ed760]"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Replace artwork
                    </Button>
                    {artworkFile && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setArtworkFile(null);
                          setArtworkUrl(null);
                          setStatusMessage("Custom artwork cleared. Platform artwork is active.");
                        }}
                        className="border-white/10 bg-transparent text-white hover:bg-white/8 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear upload
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                {activeLayerCount} active, {hiddenLayerCount} removed. Click a preview element to select it.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Creative direction</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  const preset = PACKAGING_PRESETS.find((item) => item.id === value);
                  if (preset) applyPackagingPreset(preset);
                }}
              >
                <SelectTrigger className="border-white/10 bg-white/4 text-white">
                  <SelectValue placeholder="Choose a starting point" />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGING_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="show-name">Show name</Label>
                <Input
                  id="show-name"
                  value={form.showName}
                  onChange={(event) => setFormValue("showName", event.target.value)}
                  className="border-white/10 bg-white/4 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="host-name">Host</Label>
                <Input
                  id="host-name"
                  value={form.hostName}
                  onChange={(event) => setFormValue("hostName", event.target.value)}
                  className="border-white/10 bg-white/4 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="episode-title">Episode title</Label>
                <Input
                  id="episode-title"
                  value={form.episodeTitle}
                  onChange={(event) => setFormValue("episodeTitle", event.target.value)}
                  className="border-white/10 bg-white/4 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="thumbnail-text">Thumbnail text</Label>
                <Input
                  id="thumbnail-text"
                  value={form.thumbnailText}
                  onChange={(event) => setFormValue("thumbnailText", event.target.value)}
                  className="border-white/10 bg-white/4 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="guest-name">Guest or topic</Label>
                <Input
                  id="guest-name"
                  value={form.guestName}
                  onChange={(event) => setFormValue("guestName", event.target.value)}
                  className="border-white/10 bg-white/4 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hook">Hook</Label>
                <textarea
                  id="hook"
                  value={form.hook}
                  onChange={(event) => setFormValue("hook", event.target.value)}
                  rows={4}
                  className="min-h-24 w-full resize-none rounded-md border border-white/10 bg-white/4 px-3 py-2 text-sm text-white outline-hidden ring-offset-background placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-[#1ed760]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cta">Call to action</Label>
                <Input
                  id="cta"
                  value={form.callToAction}
                  onChange={(event) => setFormValue("callToAction", event.target.value)}
                  className="border-white/10 bg-white/4 text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 border-t border-white/10 pt-4">
              <div className="grid gap-2">
                <Label>Tone</Label>
                <Select
                  value={form.tone}
                  onValueChange={(value) => setFormValue("tone", value)}
                >
                  <SelectTrigger className="border-white/10 bg-white/4 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((tone) => (
                      <SelectItem key={tone} value={tone}>
                        {tone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="primary-color">Primary</Label>
                  <Input
                    id="primary-color"
                    type="color"
                    value={form.primaryColor}
                    onChange={(event) => setFormValue("primaryColor", event.target.value)}
                    className="h-11 border-white/10 bg-white/4 p-1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="secondary-color">Secondary</Label>
                  <Input
                    id="secondary-color"
                    type="color"
                    value={form.secondaryColor}
                    onChange={(event) => setFormValue("secondaryColor", event.target.value)}
                    className="h-11 border-white/10 bg-white/4 p-1"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Waveform density</Label>
                  <span className="text-xs text-zinc-500">{waveformDensity}</span>
                </div>
                <Slider
                  min={24}
                  max={96}
                  step={6}
                  value={[waveformDensity]}
                  onValueChange={(value) => setWaveformDensity(value[0] ?? 72)}
                />
              </div>
            </div>
          </aside>

          <section className="order-1 min-w-0 overflow-hidden rounded-md border border-white/10 bg-[#090909] xl:sticky xl:top-4 xl:order-2 xl:self-start">
            <div className="flex flex-col gap-3 border-b border-white/10 bg-white/2.5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Preview
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-xl font-black sm:text-2xl">
                  <PlatformIcon id={platform.id} className="h-5 w-5" />
                  {platform.name} / {selectedAsset.name}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-2">
                  <span className="text-xs font-bold uppercase text-zinc-500">
                    Guides
                  </span>
                  <Switch checked={showSafeZones} onCheckedChange={setShowSafeZones} />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void exportSelectedAsset()}
                  disabled={isExporting}
                  className="bg-white text-black hover:bg-[#1ed760]"
                >
                  <Download className="h-4 w-4" />
                  Export PNG
                </Button>
              </div>
            </div>

            <div className="asset-stage min-w-0 overflow-hidden p-4 sm:p-5">
              <div
                className={cn(
                  "asset-frame relative mx-auto w-full max-w-full overflow-hidden rounded-md border border-white/15 bg-[#111] shadow-2xl aspect-(--preview-ratio)",
                  orientation === "vertical" && "max-w-[360px]",
                  orientation === "square" && "max-w-[560px]",
                  orientation === "landscape" && "max-w-[900px]"
                )}
                style={previewVars}
              >
                {visualLayers.artwork && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-[0.38]"
                    style={{ backgroundImage: `url(${activeArtworkUrl})` }}
                  />
                )}
                <div
                  className="asset-preview-gradient absolute inset-0"
                />
                <div
                  className="absolute left-0 top-0 h-full w-[1.4%] bg-(--studio-accent)"
                />

                {visualLayers.artwork && (
                  <button
                    type="button"
                    onClick={() => setSelectedLayerId("artwork")}
                    className={cn(
                      "absolute overflow-hidden rounded-md border bg-white/5 text-left shadow-xl transition",
                      selectedLayerId === "artwork" ? "border-[#1ed760]" : "border-white/20",
                      orientation === "landscape"
                        ? "right-[6%] top-[10%] h-[50%] w-[31%]"
                        : "left-[8%] top-[7%] h-[29%] w-[84%]"
                    )}
                    title="Select artwork"
                  >
                    <span
                      aria-label={artworkFile ? "Uploaded artwork" : platform.thumbnailAlt}
                      className="block h-full w-full bg-cover bg-center"
                      role="img"
                      style={{ backgroundImage: `url(${activeArtworkUrl})` }}
                    />
                  </button>
                )}

                {showSafeZones && (
                  <div
                    className={cn(
                      "pointer-events-none absolute border border-dashed border-white/35",
                      orientation === "vertical"
                        ? "inset-x-[10%] inset-y-[12%]"
                        : orientation === "square"
                          ? "inset-[9%]"
                          : "inset-x-[6%] inset-y-[10%]"
                    )}
                  />
                )}

                {(visualLayers.badge ||
                  visualLayers.headline ||
                  visualLayers.title ||
                  visualLayers.hook ||
                  visualLayers.cta) && (
                  <div
                    className={cn(
                      "absolute flex flex-col",
                      orientation === "landscape"
                        ? "bottom-[34%] left-[7%] right-[8%] top-[15%] sm:right-[43%]"
                        : visualLayers.artwork
                          ? "bottom-[24%] left-[8%] right-[8%] top-[41%]"
                          : "bottom-[24%] left-[8%] right-[8%] top-[13%]"
                    )}
                  >
                    {visualLayers.badge && (
                      <button
                        type="button"
                        onClick={() => setSelectedLayerId("badge")}
                        className={cn(
                          "w-fit rounded-full border bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200 transition",
                          selectedLayerId === "badge" ? "border-[#1ed760]" : "border-transparent"
                        )}
                      >
                        {platform.name} / {selectedAsset.ratio}
                      </button>
                    )}
                    {visualLayers.headline && (
                      <button
                        type="button"
                        onClick={() => setSelectedLayerId("headline")}
                        className={cn(
                          "mt-3 rounded-sm border text-left transition",
                          selectedLayerId === "headline" ? "border-[#1ed760]/70" : "border-transparent"
                        )}
                      >
                        <span
                          className={cn(
                            "line-clamp-2 text-balance font-black leading-[0.9] text-white",
                            orientation === "landscape"
                              ? "text-2xl sm:text-[44px]"
                              : "text-4xl sm:text-6xl"
                          )}
                        >
                          {form.thumbnailText || generatedCopy.title}
                        </span>
                      </button>
                    )}
                    {visualLayers.title && (
                      <button
                        type="button"
                        onClick={() => setSelectedLayerId("title")}
                        className={cn(
                          "mt-3 hidden max-w-2xl rounded-sm border text-left text-sm font-black leading-5 text-zinc-200 transition sm:line-clamp-1 sm:block",
                          selectedLayerId === "title" ? "border-[#1ed760]/70" : "border-transparent"
                        )}
                      >
                        {generatedCopy.title}
                      </button>
                    )}
                    {visualLayers.hook && (
                      <button
                        type="button"
                        onClick={() => setSelectedLayerId("hook")}
                        className={cn(
                          "mt-2 hidden max-w-2xl rounded-sm border text-left text-xs font-semibold leading-5 text-zinc-300/80 transition sm:line-clamp-2 sm:block",
                          selectedLayerId === "hook" ? "border-[#1ed760]/70" : "border-transparent"
                        )}
                      >
                        {form.hook}
                      </button>
                    )}
                    {visualLayers.cta && (
                      <button
                        type="button"
                        onClick={() => setSelectedLayerId("cta")}
                        className={cn(
                          "mt-3 w-fit rounded-full border bg-white/10 px-3 py-1.5 text-xs font-black text-(--studio-primary) transition",
                          selectedLayerId === "cta" ? "border-[#1ed760]" : "border-white/10"
                        )}
                      >
                        {form.callToAction}
                      </button>
                    )}
                  </div>
                )}

                {(visualLayers.waveform || visualLayers.footer) && (
                  <div className="absolute inset-x-[7%] bottom-[5%]">
                    {visualLayers.waveform && (
                      <button
                        type="button"
                        onClick={() => setSelectedLayerId("waveform")}
                        className={cn(
                          "flex h-7 w-full items-center gap-[3px] rounded-sm border transition sm:h-12",
                          selectedLayerId === "waveform" ? "border-[#1ed760]/70" : "border-transparent"
                        )}
                        title="Select waveform"
                      >
                        {waveform.slice(0, waveformDensity).map((peak, index) => (
                          <span
                            key={index}
                            className="block h-(--bar-height) flex-1 rounded-full bg-(--bar-color)"
                            style={styleVars({
                              "--bar-height": px(Math.max(6, peak * 30)),
                              "--bar-color": index % 7 === 0 ? "#f8fafc" : form.primaryColor,
                            })}
                          />
                        ))}
                      </button>
                    )}
                    {visualLayers.footer && (
                      <button
                        type="button"
                        onClick={() => setSelectedLayerId("footer")}
                        className={cn(
                          "mt-3 flex w-full items-center justify-between gap-3 rounded-sm border text-left text-xs font-bold uppercase tracking-[0.16em] text-zinc-400 transition",
                          selectedLayerId === "footer" ? "border-[#1ed760]/70" : "border-transparent"
                        )}
                      >
                        <span>{form.showName}</span>
                        <span>{selectedAsset.width}x{selectedAsset.height}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Current export
                </p>
                <p className="mt-1 truncate text-sm font-bold text-zinc-200">
                  {assetFilename(form, platform, selectedAsset)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void exportContactSheet()}
                  disabled={isExporting}
                  className="border-white/10 bg-transparent text-white hover:bg-white/8 hover:text-white"
                >
                  <ImageIcon className="h-4 w-4" />
                  Sheet
                </Button>
                <Button
                  type="button"
                  onClick={() => void exportPlatformPack()}
                  disabled={isExporting}
                  className="bg-[#1ed760] text-black hover:bg-[#b9fbc0]"
                >
                  <Download className="h-4 w-4" />
                  Pack
                </Button>
              </div>
            </div>
          </section>

          <aside className="order-3 min-w-0 space-y-3 rounded-md border border-white/10 bg-[#0a0a0a] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Navigate
                </p>
                <h2 className="mt-1 text-xl font-black">Assets</h2>
              </div>
              <a
                href={platform.sourceUrl}
                target="_blank"
                rel="noreferrer"
                title={platform.sourceLabel}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-white/6"
              >
                Source
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="grid gap-2">
              {platform.assets.map((asset) => {
                const isSelected = asset.id === selectedAsset.id;
                return (
                  <button
                    key={asset.id}
                    type="button"
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={cn(
                      "rounded-md border px-3 py-2 text-left transition",
                      isSelected
                        ? "border-white/30 bg-white/9"
                        : "border-white/10 bg-white/[0.035] hover:bg-white/6"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {asset.kind === "image" ? (
                            <ImageIcon className="h-4 w-4 text-zinc-500" />
                          ) : asset.kind === "audio" ? (
                            <Music2 className="h-4 w-4 text-zinc-500" />
                          ) : (
                            <Video className="h-4 w-4 text-zinc-500" />
                          )}
                          <h3 className="font-bold">{asset.name}</h3>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {asset.width} x {asset.height}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/6 px-2 py-1 text-[11px] font-bold text-zinc-300">
                        {asset.ratio}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black">Release checks</h3>
                <span className="text-sm font-black text-[#1ed760]">{readinessScore}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full w-(--ready-width) rounded-full bg-[#1ed760]"
                  style={previewVars}
                />
              </div>
              <ul className="mt-3 space-y-1.5">
                {checks.slice(0, 4).map((check) => (
                  <li key={check.label} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle2
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        check.passed ? "text-[#1ed760]" : "text-zinc-600"
                      )}
                    />
                    <span>{check.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
              <h3 className="font-black">Copy</h3>
              <div className="mt-3 space-y-2 text-sm text-zinc-300">
                <button
                  type="button"
                  onClick={() => void copyText("Title", generatedCopy.title)}
                  className="block w-full rounded-md p-2 text-left transition hover:bg-white/6"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Title
                  </p>
                  <p className="mt-1">{generatedCopy.title}</p>
                </button>
                <button
                  type="button"
                  onClick={() => void copyText("Caption", generatedCopy.caption)}
                  className="block w-full rounded-md p-2 text-left transition hover:bg-white/6"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Caption
                  </p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line">{generatedCopy.caption}</p>
                </button>
                <div className="flex flex-wrap gap-2">
                  {generatedCopy.hashtags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => void copyText("Hashtag", tag)}
                      className="rounded-full bg-white/6 px-2.5 py-1 text-xs transition hover:bg-[#1ed760] hover:text-black"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Button
                type="button"
                onClick={() => void exportPlatformPack()}
                disabled={isExporting}
                className="bg-[#1ed760] text-black hover:bg-[#b9fbc0]"
              >
                <Download className="h-4 w-4" />
                Export {platform.name} Pack
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void exportContactSheet()}
                disabled={isExporting}
                className="bg-white text-black hover:bg-[#1ed760]"
              >
                <ImageIcon className="h-4 w-4" />
                Export Contact Sheet
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void copyBrief()}
                  className="bg-white text-black hover:bg-zinc-200"
                >
                  <Copy className="h-4 w-4" />
                  Copy Brief
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    downloadJson(
                      productionBrief,
                      `${sanitizeFilename(form.episodeTitle || "podcast")}-${platform.id}-brief.json`
                    )
                  }
                  className="border-white/10 bg-transparent text-white hover:bg-white/8 hover:text-white"
                >
                  <Clipboard className="h-4 w-4" />
                  JSON
                </Button>
              </div>
              <p className="rounded-md bg-black/30 px-3 py-2 text-xs leading-5 text-zinc-500">
                {statusMessage}
              </p>
            </div>
          </aside>
        </section>

      </div>
    </main>
  );
}
