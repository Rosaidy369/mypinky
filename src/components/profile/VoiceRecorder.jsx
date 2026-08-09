import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import MicIcon from "../ui/MicIcon";
import StopIcon from "../ui/StopIcon";

const MAX_SECONDS = 10;

// A real ~8-10s recording is tens of KB; anything under this is almost
// certainly an empty/silent capture (e.g. a muted mic), not a short clip.
const MIN_VALID_BYTES = 1000;

const PREFERRED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickSupportedMimeType() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function VoiceRecorder({ voiceNote, onSave, onRemove }) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);

  const [level, setLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const meterRafRef = useRef(null);
  // Ref, not state: read from the onstop closure without going stale.
  const everHeardSoundRef = useRef(false);

  const stopLevelMeter = () => {
    if (meterRafRef.current) cancelAnimationFrame(meterRafRef.current);
    meterRafRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  const startLevelMeter = (stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteTimeDomainData(dataArray);
      let peak = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = Math.abs(dataArray[i] - 128);
        if (v > peak) peak = v;
      }
      setLevel(peak);
      if (peak > 4) everHeardSoundRef.current = true;
      meterRafRef.current = requestAnimationFrame(tick);
    };

    tick();
  };

  const startRecording = async () => {
    setError("");
    everHeardSoundRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startLevelMeter(stream);

      const mimeType = pickSupportedMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        stopLevelMeter();

        const totalBytes = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);

        if (totalBytes < MIN_VALID_BYTES || !everHeardSoundRef.current) {
          setError(t("voiceRecorder.errorNoAudio"));
          return;
        }

        // Use the codec the browser actually recorded with, not a fixed
        // literal — a mismatched declared type can break playback.
        const blobType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        setLocalPreview(URL.createObjectURL(blob));

        setUploading(true);
        try {
          await onSave(blob);
        } catch (err) {
          console.error("Error subiendo nota de voz:", err);
          setError(t("voiceRecorder.errorUploadFailed"));
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      setError(t("voiceRecorder.errorMicPermission"));
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleRemove = () => {
    setLocalPreview(null);
    onRemove();
  };

  // Prefer the just-recorded local clip over the previously saved one, so
  // re-recording always previews what you just said, not the old take.
  const previewSrc = localPreview || voiceNote;

  return (
    <div className="voice-recorder">

      {error && (
        <div className="voice-error">
          <span>{error}</span>
          <button type="button" className="voice-error-dismiss" onClick={() => setError("")} aria-label={t("voiceRecorder.closeAria")}>
            ✕
          </button>
        </div>
      )}

      {previewSrc && !isRecording && (

        <div className="voice-preview">

          <audio controls src={previewSrc} className="voice-audio"></audio>

          {uploading ? (
            <span className="voice-uploading">{t("voiceRecorder.uploading")}</span>
          ) : (
            <button type="button" className="voice-remove-btn" onClick={handleRemove}>
              ✕ {t("voiceRecorder.remove")}
            </button>
          )}

        </div>

      )}

      {!previewSrc && !isRecording && (

        <button type="button" className="voice-record-btn" onClick={startRecording}>
          <MicIcon size={16} /> {t("voiceRecorder.recordButton", { seconds: MAX_SECONDS })}
        </button>

      )}

      {isRecording && (

        <div className="voice-recording-indicator">

          <span className="recording-dot"></span>

          <span>{t("voiceRecorder.recording", { seconds, max: MAX_SECONDS })}</span>

          <button type="button" className="voice-stop-btn" onClick={stopRecording}>
            <StopIcon size={14} /> {t("voiceRecorder.stop")}
          </button>

          <div className="voice-level-meter" aria-hidden="true">
            <div
              className="voice-level-fill"
              style={{ width: `${Math.min(100, (level / 40) * 100)}%` }}
            ></div>
          </div>

          <p className="voice-level-hint">
            {level > 4 ? (
              <><MicIcon size={13} /> {t("voiceRecorder.detectingVoice")}</>
            ) : (
              t("voiceRecorder.levelHint")
            )}
          </p>

        </div>

      )}

    </div>
  );
}

export default VoiceRecorder;