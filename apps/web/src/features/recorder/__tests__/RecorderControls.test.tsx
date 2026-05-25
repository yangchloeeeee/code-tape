import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RecordingControllerState } from "@/shared/recording-schema";
import { RecorderControls, type RecorderControlsProps } from "../RecorderControls";

const AVAILABLE_MEDIA: RecordingControllerState["mediaCapability"] = {
  audio: "available",
  camera: "available",
  selectedAudioDeviceId: null,
  selectedCameraDeviceId: null,
};

function state(
  status: RecordingControllerState["status"],
  patch: Partial<RecordingControllerState> = {},
): RecordingControllerState {
  return {
    status,
    startedAt: null,
    durationMs: 65_000,
    mediaCapability: AVAILABLE_MEDIA,
    lastError: null,
    ...patch,
  };
}

function renderControls(overrides: Partial<RecorderControlsProps> = {}) {
  const props: RecorderControlsProps = {
    state: state("idle"),
    microphoneEnabled: false,
    cameraEnabled: false,
    onStart: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onStop: vi.fn(),
    onToggleMicrophone: vi.fn(),
    onToggleCamera: vi.fn(),
    onRun: vi.fn(),
    ...overrides,
  };
  return {
    props,
    ...render(<RecorderControls {...props} />),
  };
}

describe("RecorderControls", () => {
  it("enables start in idle state and only calls onStart", () => {
    const { props } = renderControls();

    expect(screen.getByText("01:05")).toBeInTheDocument();
    expect(screen.getByText("待录制")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始录制" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "暂停录制" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "继续录制" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "停止录制" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "开始录制" }));

    expect(props.onStart).toHaveBeenCalledTimes(1);
    expect(props.onPause).not.toHaveBeenCalled();
    expect(props.onResume).not.toHaveBeenCalled();
    expect(props.onStop).not.toHaveBeenCalled();
  });

  it("enables pause and stop while recording", () => {
    const { props } = renderControls({ state: state("recording") });

    expect(screen.getByText("录制中")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始录制" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "暂停录制" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "继续录制" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "停止录制" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "暂停录制" }));
    fireEvent.click(screen.getByRole("button", { name: "停止录制" }));

    expect(props.onPause).toHaveBeenCalledTimes(1);
    expect(props.onStop).toHaveBeenCalledTimes(1);
    expect(props.onStart).not.toHaveBeenCalled();
    expect(props.onResume).not.toHaveBeenCalled();
  });

  it("enables resume and stop while paused", () => {
    const { props } = renderControls({ state: state("paused") });

    expect(screen.getByText("已暂停")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始录制" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "暂停录制" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "继续录制" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "停止录制" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "继续录制" }));
    fireEvent.click(screen.getByRole("button", { name: "停止录制" }));

    expect(props.onResume).toHaveBeenCalledTimes(1);
    expect(props.onStop).toHaveBeenCalledTimes(1);
    expect(props.onStart).not.toHaveBeenCalled();
    expect(props.onPause).not.toHaveBeenCalled();
  });

  it("calls media toggle callbacks with the next pressed state", () => {
    const { props } = renderControls({
      microphoneEnabled: false,
      cameraEnabled: true,
    });

    const microphone = screen.getByRole("button", { name: "开启麦克风" });
    const camera = screen.getByRole("button", { name: "关闭摄像头" });

    expect(microphone).toHaveAttribute("aria-pressed", "false");
    expect(camera).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(microphone);
    fireEvent.click(camera);

    expect(props.onToggleMicrophone).toHaveBeenCalledWith(true);
    expect(props.onToggleCamera).toHaveBeenCalledWith(false);
  });

  it("disables unavailable media toggles with accessible names", () => {
    const { props } = renderControls({
      state: state("idle", {
        mediaCapability: {
          audio: "denied",
          camera: "not-found",
          selectedAudioDeviceId: null,
          selectedCameraDeviceId: null,
        },
      }),
    });

    const microphone = screen.getByRole("button", { name: "麦克风不可用：权限被拒绝" });
    const camera = screen.getByRole("button", { name: "摄像头不可用：未找到设备" });

    expect(microphone).toBeDisabled();
    expect(camera).toBeDisabled();

    fireEvent.click(microphone);
    fireEvent.click(camera);

    expect(props.onToggleMicrophone).not.toHaveBeenCalled();
    expect(props.onToggleCamera).not.toHaveBeenCalled();
  });

  it("shows error feedback and keeps run callback prop-driven", () => {
    const { props } = renderControls({
      state: state("failed", {
        lastError: { code: "recorder-error", message: "设备被占用，无法开始录制" },
      }),
    });

    expect(screen.getByText("录制错误")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("设备被占用，无法开始录制");

    fireEvent.click(screen.getByRole("button", { name: "运行代码" }));

    expect(props.onRun).toHaveBeenCalledTimes(1);
  });
});
