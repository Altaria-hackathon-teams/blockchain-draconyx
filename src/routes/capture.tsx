import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Camera, Upload, MapPin, FileText, ShieldCheck, X, Mic, WifiOff } from "lucide-react";
import { useShake, requestMotionPermission } from "@/lib/shake";
import { isOnline, count as offlineCount, enqueue } from "@/lib/offline";

export const Route = createFileRoute("/capture")({
  head: () => ({
    meta: [{ title: "Capture Evidence — SilentWitness" }],
  }),
  component: CapturePage,
});

function CapturePage() {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  // Shake-to-record state
  const [shakeArmed, setShakeArmed] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Offline state
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    setOnline(isOnline());
    setQueued(offlineCount());
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function startRecording() {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const f = new File([blob], `shake-recording-${Date.now()}.webm`, { type: "audio/webm" });
        pickFile(f);
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      // Auto-stop after 15s
      setTimeout(() => rec.state === "recording" && rec.stop(), 15000);
    } catch (e) {
      console.error("mic error", e);
      setRecording(false);
    }
  }

  function stopRecording() {
    recorderRef.current?.state === "recording" && recorderRef.current?.stop();
  }

  useShake({
    enabled: shakeArmed && !recording,
    onShake: () => {
      void startRecording();
    },
  });

  async function armShake() {
    const ok = await requestMotionPermission();
    setShakeArmed(ok);
  }

  function pickFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleGeo() {
    const fallbackGeo = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.latitude && data.longitude) {
          setLocation(`${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`);
        } else {
          setLocation("");
        }
      } catch (e) {
        setLocation("");
      }
    };

    if (!navigator.geolocation) {
      fallbackGeo();
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (p) => setLocation(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`),
      () => fallbackGeo()
    );
  }

  async function submit() {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const payload = {
        dataUrl: reader.result as string,
        name: file.name,
        type: file.type,
        size: file.size,
        description,
        location,
      };
      if (!isOnline()) {
        enqueue(payload);
        setQueued(offlineCount());
        alert("You are offline. Evidence has been queued and will process when you're back online.");
        return;
      }
      sessionStorage.setItem("sw:pending", JSON.stringify(payload));
      nav({ to: "/processing" });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-12">
        {!online && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
            <WifiOff className="h-4 w-4" /> You are offline. Submissions will be queued.
            {queued > 0 && <span className="ml-auto font-mono text-xs">{queued} queued</span>}
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Capture Evidence</h1>
          <p className="mt-2 text-muted-foreground">
            Upload a photo, audio, or video. Everything is processed locally before being sealed.
          </p>
        </div>

        <div className="space-y-6 rounded-2xl border border-border bg-gradient-card p-6 shadow-elegant">
          {/* Dropzone */}
          {!file ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-background/40 px-6 py-16 transition-colors hover:border-primary/60 hover:bg-primary/5"
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div className="text-center">
                <div className="font-medium">Click to upload or drop a file</div>
                <div className="mt-1 text-xs text-muted-foreground">Image · Audio · Video — up to 50 MB</div>
              </div>
            </button>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-border bg-background/40">
              <button
                onClick={() => { setFile(null); setPreview(""); }}
                className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              {file.type.startsWith("image/") ? (
                <img src={preview} alt="" className="max-h-[400px] w-full object-contain bg-black/40" />
              ) : file.type.startsWith("video/") ? (
                <video src={preview} controls className="max-h-[400px] w-full bg-black" />
              ) : file.type.startsWith("audio/") ? (
                <div className="p-8">
                  <audio src={preview} controls className="w-full" />
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">{file.name}</div>
              )}
              <div className="flex items-center justify-between border-t border-border bg-card/60 px-4 py-2.5 font-mono text-xs">
                <span className="truncate">{file.name}</span>
                <span className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
          />

          {/* Camera capture */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background/40 px-4 py-3 text-sm transition-colors hover:bg-secondary"
            >
              <Upload className="h-4 w-4" /> Choose file
            </button>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background/40 px-4 py-3 text-sm transition-colors hover:bg-secondary">
              <Camera className="h-4 w-4" /> Use camera
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
              />
            </label>
          </div>

          {/* Shake-to-record audio */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/40 px-4 py-3 text-sm">
            <Mic className={`h-4 w-4 ${recording ? "text-destructive animate-pulse" : "text-primary"}`} />
            <span className="font-medium">
              {recording ? "Recording…" : shakeArmed ? "Shake to record audio" : "Quick audio capture"}
            </span>
            <span className="text-xs text-muted-foreground">
              {recording ? "Auto-stops in 15s" : "15s max — for emergency moments"}
            </span>
            <div className="ml-auto flex gap-2">
              {!shakeArmed && !recording && (
                <button
                  type="button"
                  onClick={armShake}
                  className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-secondary"
                >
                  Arm shake
                </button>
              )}
              {!recording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="rounded-md bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/25"
                >
                  Record now
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="rounded-md bg-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/30"
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" /> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this evidence show? When did the incident happen?"
              rows={3}
              className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {/* Location */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-primary" /> Location (optional)
            </label>
            <div className="flex gap-2">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lat, Long or address"
                className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleGeo}
                className="rounded-lg border border-border bg-background/60 px-3 text-sm transition-colors hover:bg-secondary"
              >
                GPS
              </button>
            </div>
          </div>

          <button
            disabled={!file}
            onClick={submit}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-glow transition-all disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShieldCheck className="h-5 w-5" /> Secure Evidence
          </button>
        </div>
      </div>
    </div>
  );
}
