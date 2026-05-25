import type { RecordingControllerState } from "@/shared/recording-schema";
import { formatDurationMs } from "@/shared/time/duration";
import { IconButton, Toggle, Toolbar, ToolbarSeparator, ToolbarSpacer, cn } from "@/shared/ui";
import {
  Camera,
  CameraOff,
  Circle,
  CircleAlert,
  CircleDot,
  Code2,
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
} from "lucide-react";

export type RecorderControlsProps = {
  state: RecordingControllerState;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
  onStart(): void;
  onPause(): void;
  onResume(): void;
  onStop(): void;
  onToggleMicrophone(next: boolean): void;
  onToggleCamera(next: boolean): void;
  onRun(): void;
};

export function RecorderControls({
  state,
  microphoneEnabled,
  cameraEnabled,
  onStart,
  onPause,
  onResume,
  onStop,
  onToggleMicrophone,
  onToggleCamera,
  onRun,
}: RecorderControlsProps) {
  const isIdle = state.status === "idle";
  const isRecording = state.status === "recording";
  const isPaused = state.status === "paused";
  const isBusy =
    state.status === "requestingPermission" ||
    state.status === "stopping" ||
    state.status === "processing";
  const audioDisabled = state.mediaCapability.audio !== "available";
  const cameraDisabled = state.mediaCapability.camera !== "available";
  const canStop = isRecording || isPaused;
  const statusLabel = STATUS_LABELS[state.status];
  const audioLabel = audioDisabled
    ? `麦克风不可用：${capabilityLabel(state.mediaCapability.audio)}`
    : microphoneEnabled
      ? "关闭麦克风"
      : "开启麦克风";
  const cameraLabel = cameraDisabled
    ? `摄像头不可用：${capabilityLabel(state.mediaCapability.camera)}`
    : cameraEnabled
      ? "关闭摄像头"
      : "开启摄像头";

  return (
    <Toolbar className="h-auto min-h-14 flex-wrap gap-2 px-3 py-2">
      <div
        className="flex min-w-[9.75rem] items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2"
        aria-label={`录制状态：${statusLabel}`}
      >
        <span
          aria-hidden
          className={cn(
            "inline-flex h-2.5 w-2.5 shrink-0 rounded-full",
            isRecording ? "animate-record-pulse bg-record" : "bg-border",
            isPaused ? "bg-pause" : null,
            state.status === "failed" ? "bg-danger" : null,
          )}
        />
        <div className="min-w-0">
          <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatDurationMs(state.durationMs)}
          </div>
          <div className="truncate text-[11px] font-medium uppercase tracking-wider text-muted">
            {statusLabel}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <IconButton
          label="开始录制"
          icon={<CircleDot size={18} />}
          variant="danger"
          disabled={!isIdle}
          onClick={onStart}
        />
        <IconButton
          label="暂停录制"
          icon={<Pause size={18} />}
          variant="subtle"
          disabled={!isRecording}
          onClick={onPause}
        />
        <IconButton
          label="继续录制"
          icon={<Play size={18} />}
          variant="subtle"
          disabled={!isPaused}
          onClick={onResume}
        />
        <IconButton
          label="停止录制"
          icon={<Square size={18} />}
          variant="subtle"
          disabled={!canStop}
          onClick={onStop}
        />
      </div>

      <ToolbarSeparator />

      <div className="flex items-center gap-1">
        <Toggle
          pressed={microphoneEnabled}
          onPressedChange={onToggleMicrophone}
          disabled={audioDisabled}
          label={audioLabel}
          icon={<MicOff size={17} />}
          iconPressed={<Mic size={17} />}
        />
        <Toggle
          pressed={cameraEnabled}
          onPressedChange={onToggleCamera}
          disabled={cameraDisabled}
          label={cameraLabel}
          icon={<CameraOff size={17} />}
          iconPressed={<Camera size={17} />}
        />
      </div>

      <ToolbarSeparator />

      <IconButton
        label="运行代码"
        icon={<Code2 size={18} />}
        variant="ghost"
        disabled={isBusy}
        onClick={onRun}
      />

      {state.lastError ? (
        <div
          role="status"
          aria-live="polite"
          className="flex min-w-[12rem] max-w-full items-center gap-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-foreground md:max-w-[28rem]"
        >
          <CircleAlert aria-hidden size={16} className="shrink-0 text-danger" />
          <span className="truncate">
            {state.lastError.message || "录制发生错误，请重试"}
          </span>
        </div>
      ) : null}

      <ToolbarSpacer />

      <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
        <Circle aria-hidden size={10} className={microphoneEnabled ? "fill-success text-success" : ""} />
        <span>麦克风 {microphoneEnabled ? "开" : "关"}</span>
        <Circle aria-hidden size={10} className={cameraEnabled ? "fill-success text-success" : ""} />
        <span>摄像头 {cameraEnabled ? "开" : "关"}</span>
      </div>
    </Toolbar>
  );
}

const STATUS_LABELS: Record<RecordingControllerState["status"], string> = {
  idle: "待录制",
  requestingPermission: "请求权限",
  recording: "录制中",
  paused: "已暂停",
  stopping: "停止中",
  processing: "处理中",
  completed: "已完成",
  failed: "录制错误",
};

function capabilityLabel(capability: RecordingControllerState["mediaCapability"]["audio"]): string {
  switch (capability) {
    case "available":
      return "可用";
    case "denied":
      return "权限被拒绝";
    case "not-found":
      return "未找到设备";
    case "busy":
      return "设备被占用";
    case "unsupported":
      return "浏览器不支持";
  }
}
