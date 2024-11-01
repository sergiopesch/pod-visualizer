"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Activity,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Upload,
} from "lucide-react";

export function PodVisualizer() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [apiKey, setApiKey] = useState("");
  const [showEffects, setShowEffects] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setAudioFile(file);
    if (audioRef.current) {
      audioRef.current.src = URL.createObjectURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".ogg"],
    },
  });

  const generateVideo = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsGenerated(true);
    }, 3000);
  };

  const exportVideo = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("Video exported successfully!");
    }, 3000);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const drawWaveform = (
    canvas: HTMLCanvasElement,
    audioElement: HTMLAudioElement
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const squareSize = Math.floor(canvas.width / Math.sqrt(bufferLength));
    const gridSize = Math.floor(Math.sqrt(bufferLength));

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "rgb(20, 20, 20)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const index = i * gridSize + j;
          if (index < bufferLength) {
            const value = dataArray[index];
            const intensity = value / 255;
            ctx.fillStyle = `rgba(0, ${Math.floor(
              255 * intensity
            )}, ${Math.floor(255 * intensity)}, 1)`;
            ctx.fillRect(
              j * squareSize,
              i * squareSize,
              squareSize - 1,
              squareSize - 1
            );
          }
        }
      }
    };

    draw();
  };

  useEffect(() => {
    if (canvasRef.current && audioRef.current && audioFile && isGenerated) {
      canvasRef.current.width = 1080;
      canvasRef.current.height = 1080;
      drawWaveform(canvasRef.current, audioRef.current);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioFile, isGenerated]);

  return (
    <div className="flex flex-col min-h-screen bg-background p-4">
      <header className="border-b pb-4 mb-4">
        <div className="flex items-center space-x-4">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Pod Visualizer</h1>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Audio Input</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-primary/50 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p>Drop the audio file here ...</p>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p>Drag & drop an audio file here, or click to select</p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: MP3, WAV, OGG
                    </p>
                  </div>
                )}
              </div>
              {audioFile && (
                <div className="mt-2 text-sm text-muted-foreground">
                  File loaded: {audioFile.name}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Effects
                <Switch
                  checked={showEffects}
                  onCheckedChange={setShowEffects}
                />
              </CardTitle>
            </CardHeader>
            {showEffects && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Effect Type</Label>
                  <Select value="waveform" disabled>
                    <SelectTrigger>
                      <SelectValue>Waveform</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waveform">Waveform</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Model Selection</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4 Vision</SelectItem>
                      <SelectItem value="claude">Claude 3</SelectItem>
                      <SelectItem value="gemini">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={generateVideo}
                  disabled={!audioFile || isProcessing || !apiKey}
                >
                  {isProcessing ? "Processing..." : "Generate Video"}
                </Button>
              </CardContent>
            )}
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center aspect-square">
                {isGenerated ? (
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full max-w-[1080px] max-h-[1080px]"
                  />
                ) : (
                  <p className="text-muted-foreground">
                    Generate a video to see the visualization
                  </p>
                )}
              </div>
              {isGenerated && (
                <>
                  <div className="mt-4 flex justify-center space-x-4">
                    <Button variant="ghost" size="icon">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={togglePlayPause}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4">
                    <Label>Volume</Label>
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4" />
                      <Slider defaultValue={[75]} max={100} step={1} />
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={exportVideo}
                    disabled={isExporting}
                  >
                    {isExporting ? "Exporting..." : "Export Video"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
