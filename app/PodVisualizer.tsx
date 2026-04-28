"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDropzone } from "react-dropzone";
import {
  Activity,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Mic2,
  Music2,
  Radio,
  UploadCloud,
  Video,
  X,
  Youtube,
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

type PlatformId = "youtube" | "spotify" | "x" | "tiktok";
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

const SPEC_VERIFIED_AT = "April 28, 2026";

const DEFAULT_FORM: StudioForm = {
  showName: "Sergio Pesch Studio",
  hostName: "Sergio Pesch",
  episodeTitle: "I Built a Podcast Asset Machine in 7 Days",
  guestName: "Creator systems",
  hook: "One recording becomes every platform asset before the episode goes live.",
  thumbnailText: "4 PLATFORMS",
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
  {
    id: "tiktok",
    name: "TikTok",
    shortName: "TT",
    accent: "#25f4ee",
    accentSoft: "#fe2c55",
    sourceUrl:
      "https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads?lang=en",
    sourceLabel: "TikTok auction in-feed ads",
    primaryUse: "Vertical hooks, safe-zone edits, and creator-style cutdowns.",
    capabilityTags: [
      "9:16 short",
      "Safe-zone captions",
      "Hook frame",
      "Profile-ready tile",
    ],
    copyLimit: 150,
    titleLimit: 80,
    assets: [
      {
        id: "tiktok-vertical",
        name: "Vertical Cut",
        kind: "video",
        useCase: "Organic or in-feed clip",
        width: 1080,
        height: 1920,
        ratio: "9:16",
        exportLabel: "MP4/MOV",
        requirements: [
          "9:16 vertical is recommended",
          "Use at least 540 x 960 px for non-Spark ads",
          "File size up to 500 MB",
          "Keep core text inside the caption-safe middle area",
        ],
      },
      {
        id: "tiktok-hook",
        name: "Hook Frame",
        kind: "image",
        useCase: "First-frame retention",
        width: 1080,
        height: 1920,
        ratio: "9:16",
        exportLabel: "PNG poster",
        requirements: [
          "Open with the question or tension immediately",
          "Use large type and one focal image",
          "Avoid interface-mimicking UI",
          "Design around overlay captions and app controls",
        ],
      },
      {
        id: "tiktok-square",
        name: "Square Fallback",
        kind: "video",
        useCase: "Secondary placement",
        width: 1080,
        height: 1080,
        ratio: "1:1",
        exportLabel: "MP4/MOV / PNG frame",
        requirements: [
          "Square is supported for non-Spark ads",
          "Use 640 x 640 px or higher",
          "Keep all creative high resolution and unstretched",
          "Use sound and coherent audio transitions",
        ],
      },
      {
        id: "tiktok-profile",
        name: "Profile Tile Master",
        kind: "image",
        useCase: "Creator profile identity",
        width: 512,
        height: 512,
        ratio: "1:1",
        exportLabel: "JPG/PNG",
        requirements: [
          "Use this square master to prepare the 98 x 98 px profile upload",
          "Keep the key mark inside the center 66 x 66 px",
          "File size should stay under 50 KB",
          "Use a simple mark, not a full thumbnail",
        ],
      },
    ],
  },
];

const DEFAULT_WAVEFORM = Array.from({ length: 96 }, (_, index) => {
  const wave = Math.sin(index * 0.42) * 0.34 + Math.sin(index * 0.11) * 0.24;
  return Math.min(1, Math.max(0.14, 0.52 + wave));
});

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
  "Extreme Promise",
  "Founder Mode",
  "Premium Documentary",
  "Calm Expert",
];

const PACKAGING_PRESETS: PackagingPreset[] = [
  {
    id: "extreme-promise",
    name: "Extreme Promise",
    title: "I Built a Podcast Asset Machine in 7 Days",
    thumbnailText: "4 PLATFORMS",
    hook: "One recording becomes every platform asset before the episode goes live.",
    callToAction: "Export the pack and publish today.",
    tone: "High Retention",
    primaryColor: "#ffd400",
    secondaryColor: "#31c7d4",
  },
  {
    id: "curiosity-gap",
    name: "Curiosity Gap",
    title: "This Changed My Podcast Workflow",
    thumbnailText: "WAIT...",
    hook: "The hidden bottleneck was not editing. It was packaging the episode for every platform.",
    callToAction: "Steal the workflow and test the hook.",
    tone: "Extreme Promise",
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
    id: "human-stakes",
    name: "Human Stakes",
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

function PlatformIcon({ id, className }: { id: PlatformId; className?: string }) {
  if (id === "youtube") return <Youtube className={className} />;
  if (id === "spotify") return <Radio className={className} />;
  if (id === "x") return <X className={className} />;
  return <Music2 className={className} />;
}

function getPlatform(id: PlatformId) {
  return PLATFORM_CONFIGS.find((platform) => platform.id === id) ?? PLATFORM_CONFIGS[0];
}

function ratioLabel(width: number, height: number) {
  return width === height ? "square" : width > height ? "landscape" : "vertical";
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

  if (platform.id === "tiktok") {
    return {
      title: title,
      caption: `${hook} ${cta}`,
      hashtags: ["#podcastclip", "#creatorsoftiktok", "#learnontiktok"],
      prompt: `Create a vertical ${form.tone.toLowerCase()} TikTok cutdown for "${title}" using the hook text "${thumbnailText}", safe-zone captions, and a save/share cue.`,
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
  copy: GeneratedCopy
) {
  return {
    verifiedSpecSnapshot: SPEC_VERIFIED_AT,
    platform: platform.name,
    source: platform.sourceUrl,
    project: {
      showName: form.showName,
      hostName: form.hostName,
      episodeTitle: form.episodeTitle,
      guestName: form.guestName,
      thumbnailText: form.thumbnailText,
      tone: form.tone,
      colors: [form.primaryColor, form.secondaryColor],
    },
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
  artworkUrl,
}: {
  asset: AssetSpec;
  platform: PlatformConfig;
  form: StudioForm;
  copy: GeneratedCopy;
  waveform: number[];
  waveformDensity: number;
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
  const artworkImage = artworkUrl ? await loadImage(artworkUrl) : null;

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
  let artY = pad * 1.6;
  let artWidth = width - pad * 2;
  let artHeight = Math.min(height * 0.34, artWidth * 0.62);

  if (orientation === "landscape") {
    artWidth = Math.min(height * 0.62, width * 0.34);
    artHeight = artWidth;
    artX = width - pad - artWidth;
    artY = pad * 1.8;
  } else if (orientation === "square") {
    artWidth = width - pad * 2;
    artHeight = artWidth * 0.56;
    artX = pad;
    artY = pad * 1.45;
  }

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

  const pillX = orientation === "landscape" ? pad : pad;
  const pillY = orientation === "landscape" ? pad * 1.55 : artY + artHeight + pad * 0.62;
  ctx.fillStyle = "rgba(248, 250, 252, 0.1)";
  roundedRect(ctx, pillX, pillY, Math.min(width * 0.42, 420), minSide * 0.052, minSide * 0.026);
  ctx.fill();
  ctx.fillStyle = platform.accent;
  ctx.font = `800 ${Math.max(18, minSide * 0.022)}px Inter, Arial, sans-serif`;
  ctx.fillText(
    `${platform.name.toUpperCase()}  ${asset.ratio}  ${asset.useCase.toUpperCase()}`,
    pillX + minSide * 0.028,
    pillY + minSide * 0.035
  );

  const textX = pad;
  const titleY = orientation === "landscape" ? height * 0.36 : pillY + minSide * 0.12;
  const textMaxWidth =
    orientation === "landscape" ? width - artWidth - pad * 3 : width - pad * 2;
  const titleSize =
    orientation === "landscape" ? Math.min(104, height * 0.095) : Math.min(132, width * 0.105);
  const titleHeight = drawTextBlock(
    ctx,
    thumbnailText,
    textX,
    titleY,
    textMaxWidth,
    titleSize,
    orientation === "landscape" ? 3 : 4,
    "#f8fafc"
  );

  ctx.font = `600 ${Math.max(22, minSide * 0.032)}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "rgba(248, 250, 252, 0.72)";
  const titleLines = wrapLines(ctx, title, textMaxWidth, 1);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, textX, titleY + titleHeight + minSide * 0.048 + index * minSide * 0.044);
  });

  ctx.font = `500 ${Math.max(20, minSide * 0.026)}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "rgba(248, 250, 252, 0.62)";
  const subtitleLines = wrapLines(ctx, subtitle, textMaxWidth, orientation === "vertical" ? 3 : 2);
  subtitleLines.forEach((line, index) => {
    ctx.fillText(line, textX, titleY + titleHeight + minSide * 0.1 + index * minSide * 0.038);
  });

  const waveHeight = Math.max(44, minSide * 0.11);
  const waveY = height - pad - waveHeight;
  drawWaveform(ctx, waveform, pad, waveY, width - pad * 2, waveHeight, form.primaryColor, waveformDensity);

  ctx.fillStyle = "rgba(248, 250, 252, 0.78)";
  ctx.font = `700 ${Math.max(18, minSide * 0.024)}px Inter, Arial, sans-serif`;
  ctx.fillText(form.showName || "Podcast Studio", pad, height - pad * 0.36);

  ctx.textAlign = "right";
  ctx.fillStyle = platform.accentSoft;
  ctx.fillText(`${asset.width}x${asset.height}`, width - pad, height - pad * 0.36);
  ctx.textAlign = "left";

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

export function PodVisualizer() {
  const [selectedPlatformId, setSelectedPlatformId] = useState<PlatformId>("spotify");
  const [selectedAssetId, setSelectedAssetId] = useState("spotify-video");
  const [form, setForm] = useState<StudioForm>(DEFAULT_FORM);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [waveform, setWaveform] = useState(DEFAULT_WAVEFORM);
  const [waveformDensity, setWaveformDensity] = useState(72);
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
    () => buildProductionBrief(form, platform, generatedCopy),
    [form, generatedCopy, platform]
  );

  useEffect(() => {
    if (!platform.assets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(platform.assets[0].id);
    }
  }, [platform.assets, selectedAssetId]);

  useEffect(() => {
    if (!artworkFile) {
      setArtworkUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setArtworkUrl(String(reader.result));
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
        artworkUrl,
      });
      const filename = `${sanitizeFilename(form.episodeTitle || "podcast")}-${targetPlatform.id}-${asset.id}.png`;
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
          artworkUrl,
        });
        const filename = `${sanitizeFilename(form.episodeTitle || "podcast")}-${platform.id}-${asset.id}.png`;
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
      label: artworkFile ? "Custom artwork loaded" : "Fallback artwork ready",
      passed: true,
    },
    {
      label: audioFile ? "Source audio waveform loaded" : "Fallback waveform ready",
      passed: true,
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
        "min-h-screen overflow-x-hidden bg-[#050505] text-zinc-50 outline-none",
        isDragActive && "cursor-copy"
      )}
    >
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-black/75 p-6 backdrop-blur-sm">
          <div className="rounded-md border border-[#1ed760] bg-[#0c0c0c] px-6 py-5 text-center shadow-2xl">
            <UploadCloud className="mx-auto h-8 w-8 text-[#1ed760]" />
            <p className="mt-3 text-lg font-black">Drop media anywhere</p>
            <p className="mt-1 text-sm text-zinc-400">Artwork updates the frame. Audio updates the waveform.</p>
          </div>
        </div>
      )}
      <div className="mx-auto flex min-h-screen w-full max-w-[min(1720px,100vw)] flex-col overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1ed760] text-black">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1ed760]">
                  Packaging Lab
                </p>
                <h1 className="text-3xl font-black leading-none tracking-normal sm:text-5xl">
                  Build the pack. Test the click.
                </h1>
              </div>
            </div>
            <p className="max-w-4xl text-sm leading-6 text-zinc-400 sm:text-base">
              Four platform packs with high-contrast packaging, short hooks,
              safe zones, waveform cards, and export-ready briefs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 sm:grid-cols-4 lg:min-w-[560px]">
            <button
              type="button"
              onClick={open}
              className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-[#1ed760]"
            >
              <div className="text-2xl font-black text-white">Drop</div>
              <div className="mt-1 uppercase tracking-[0.16em]">media</div>
            </button>
            <button
              type="button"
              onClick={() => void exportPlatformPack()}
              disabled={isExporting}
              className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-[#1ed760] disabled:opacity-50"
            >
              <div className="text-2xl font-black text-white">{platform.assets.length}</div>
              <div className="mt-1 uppercase tracking-[0.16em]">exports</div>
            </button>
            <button
              type="button"
              onClick={() => void copyBrief()}
              className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-[#1ed760]"
            >
              <div className="text-2xl font-black text-white">{readinessScore}%</div>
              <div className="mt-1 uppercase tracking-[0.16em]">brief</div>
            </button>
            <a
              href={platform.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-[#1ed760]"
            >
              <div className="text-2xl font-black text-white">2026</div>
              <div className="mt-1 uppercase tracking-[0.16em]">source</div>
            </a>
          </div>
        </header>

        <section className="grid w-full max-w-[calc(100vw_-_2rem)] grid-cols-2 gap-2 py-3 sm:max-w-none lg:grid-cols-4 lg:gap-3 lg:py-4">
          {PLATFORM_CONFIGS.map((item) => {
            const isSelected = item.id === selectedPlatformId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedPlatformId(item.id)}
                title={item.primaryUse}
                className={cn(
                  "min-w-0 overflow-hidden rounded-md border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760] sm:p-4",
                  isSelected
                    ? "border-white/30 bg-white/[0.09]"
                    : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="relative flex h-9 w-9 items-center justify-center rounded-md text-black"
                    style={styleVars({ "--platform-color": item.accent })}
                  >
                    <span className="absolute h-9 w-9 rounded-md bg-[var(--platform-color)]" />
                    <PlatformIcon id={item.id} className="relative h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase text-zinc-400 sm:text-[11px]">
                    {item.assets.length} assets
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-black sm:mt-4 sm:text-xl">{item.name}</h2>
                <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                  {item.capabilityTags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-zinc-300 sm:text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </section>

        <section className="grid w-full max-w-[calc(100vw_-_2rem)] flex-1 gap-4 sm:max-w-none xl:grid-cols-[360px_minmax(520px,1fr)_400px]">
          <aside className="order-2 min-w-0 space-y-4 rounded-md border border-white/10 bg-[#0c0c0c] p-4 xl:order-1">
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/[0.06]">
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

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Packaging preset</Label>
                <span className="text-xs text-zinc-500">MrBeast-style rules</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PACKAGING_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPackagingPreset(preset)}
                    className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs font-bold text-zinc-200 transition hover:border-[#1ed760] hover:bg-[#1ed760]/10"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="show-name">Show name</Label>
                <Input
                  id="show-name"
                  value={form.showName}
                  onChange={(event) => setFormValue("showName", event.target.value)}
                  className="border-white/10 bg-white/[0.04] text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="host-name">Host</Label>
                <Input
                  id="host-name"
                  value={form.hostName}
                  onChange={(event) => setFormValue("hostName", event.target.value)}
                  className="border-white/10 bg-white/[0.04] text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="episode-title">Episode title</Label>
                <Input
                  id="episode-title"
                  value={form.episodeTitle}
                  onChange={(event) => setFormValue("episodeTitle", event.target.value)}
                  className="border-white/10 bg-white/[0.04] text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="thumbnail-text">Thumbnail text</Label>
                <Input
                  id="thumbnail-text"
                  value={form.thumbnailText}
                  onChange={(event) => setFormValue("thumbnailText", event.target.value)}
                  className="border-white/10 bg-white/[0.04] text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="guest-name">Guest or topic</Label>
                <Input
                  id="guest-name"
                  value={form.guestName}
                  onChange={(event) => setFormValue("guestName", event.target.value)}
                  className="border-white/10 bg-white/[0.04] text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hook">Hook</Label>
                <textarea
                  id="hook"
                  value={form.hook}
                  onChange={(event) => setFormValue("hook", event.target.value)}
                  rows={4}
                  className="min-h-24 w-full resize-none rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none ring-offset-background placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-[#1ed760]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cta">Call to action</Label>
                <Input
                  id="cta"
                  value={form.callToAction}
                  onChange={(event) => setFormValue("callToAction", event.target.value)}
                  className="border-white/10 bg-white/[0.04] text-white"
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
                  <SelectTrigger className="border-white/10 bg-white/[0.04] text-white">
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
                    className="h-11 border-white/10 bg-white/[0.04] p-1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="secondary-color">Secondary</Label>
                  <Input
                    id="secondary-color"
                    type="color"
                    value={form.secondaryColor}
                    onChange={(event) => setFormValue("secondaryColor", event.target.value)}
                    className="h-11 border-white/10 bg-white/[0.04] p-1"
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
            <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
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
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
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
                  "asset-frame relative mx-auto w-full max-w-full overflow-hidden rounded-md border border-white/15 bg-[#111] shadow-2xl [aspect-ratio:var(--preview-ratio)]",
                  orientation === "vertical" && "max-w-[360px]",
                  orientation === "square" && "max-w-[560px]",
                  orientation === "landscape" && "max-w-[900px]"
                )}
                style={previewVars}
              >
                {artworkUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url(${artworkUrl})` }}
                  />
                )}
                <div
                  className="asset-preview-gradient absolute inset-0"
                />
                <div
                  className="absolute left-0 top-0 h-full w-[1.4%] bg-[var(--studio-accent)]"
                />

                <div
                  className={cn(
                    "absolute overflow-hidden rounded-md border border-white/20 bg-white/[0.05] shadow-xl",
                    orientation === "landscape"
                      ? "right-[6%] top-[10%] h-[50%] w-[31%]"
                      : "left-[8%] top-[7%] h-[29%] w-[84%]"
                  )}
                >
                  {artworkUrl ? (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${artworkUrl})` }}
                    />
                  ) : (
                    <div
                      className="asset-fallback-art flex h-full w-full items-end justify-center p-5"
                    >
                      <span className="rounded-md bg-black/70 px-4 py-2 text-xl font-black text-white">
                        {platform.shortName}
                      </span>
                    </div>
                  )}
                </div>

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

                <div
                  className={cn(
                    "absolute flex flex-col",
                    orientation === "landscape"
                      ? "bottom-[30%] left-[7%] right-[43%] top-[15%]"
                      : "bottom-[25%] left-[8%] right-[8%] top-[41%]"
                  )}
                >
                  <div className="w-fit rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200">
                    {platform.name} / {selectedAsset.ratio}
                  </div>
                  <h3
                    className={cn(
                      "mt-3 text-balance font-black leading-[0.9] text-white",
                      orientation === "landscape"
                        ? "text-4xl sm:text-[44px]"
                        : "text-4xl sm:text-6xl"
                    )}
                  >
                    {form.thumbnailText || generatedCopy.title}
                  </h3>
                  <p className="mt-3 line-clamp-1 max-w-2xl text-sm font-black leading-5 text-zinc-200">
                    {generatedCopy.title}
                  </p>
                </div>

                <div className="absolute inset-x-[7%] bottom-[5%]">
                  <div className="flex h-10 items-center gap-[3px] sm:h-12">
                    {waveform.slice(0, waveformDensity).map((peak, index) => (
                      <span
                        key={index}
                        className="block h-[var(--bar-height)] flex-1 rounded-full bg-[var(--bar-color)]"
                        style={styleVars({
                          "--bar-height": px(Math.max(8, peak * 42)),
                          "--bar-color": index % 7 === 0 ? "#f8fafc" : form.primaryColor,
                        })}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                    <span>{form.showName}</span>
                    <span>{selectedAsset.width}x{selectedAsset.height}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="order-3 min-w-0 space-y-4 rounded-md border border-white/10 bg-[#0c0c0c] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Output
                </p>
                <h2 className="mt-1 text-xl font-black">Asset matrix</h2>
              </div>
              <a
                href={platform.sourceUrl}
                target="_blank"
                rel="noreferrer"
                title={platform.sourceLabel}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-white/[0.06]"
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
                      "rounded-md border p-3 text-left transition",
                      isSelected
                        ? "border-white/30 bg-white/[0.09]"
                        : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
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
                        <p className="mt-1 text-xs text-zinc-500">{asset.useCase}</p>
                      </div>
                      <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[11px] font-bold text-zinc-300">
                        {asset.ratio}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                      <span>{asset.width} x {asset.height}</span>
                      <span>{asset.exportLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black">Spec rules</h3>
                <span className="text-xs text-zinc-500">
                  Tap to copy
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {selectedAsset.requirements.map((requirement) => (
                  <li key={requirement}>
                    <button
                      type="button"
                      onClick={() => void copyText("Requirement", requirement)}
                      className="flex w-full gap-2 rounded-md px-2 py-1.5 text-left text-sm leading-5 text-zinc-300 transition hover:bg-white/[0.06]"
                    >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1ed760]" />
                    <span>{requirement}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black">Release checks</h3>
                <span className="text-sm font-black text-[#1ed760]">{readinessScore}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full w-[var(--ready-width)] rounded-full bg-[#1ed760]"
                  style={previewVars}
                />
              </div>
              <ul className="mt-3 space-y-2">
                {checks.map((check) => (
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

            <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
              <h3 className="font-black">Generated copy</h3>
              <div className="mt-3 space-y-3 text-sm text-zinc-300">
                <button
                  type="button"
                  onClick={() => void copyText("Title", generatedCopy.title)}
                  className="block w-full rounded-md p-2 text-left transition hover:bg-white/[0.06]"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Title
                  </p>
                  <p className="mt-1">{generatedCopy.title}</p>
                </button>
                <button
                  type="button"
                  onClick={() => void copyText("Caption", generatedCopy.caption)}
                  className="block w-full rounded-md p-2 text-left transition hover:bg-white/[0.06]"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Caption
                  </p>
                  <p className="mt-1 whitespace-pre-line">{generatedCopy.caption}</p>
                </button>
                <div className="flex flex-wrap gap-2">
                  {generatedCopy.hashtags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => void copyText("Hashtag", tag)}
                      className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs transition hover:bg-[#1ed760] hover:text-black"
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
                  className="border-white/10 bg-transparent text-white hover:bg-white/[0.08] hover:text-white"
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
