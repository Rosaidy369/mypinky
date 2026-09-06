import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CameraIcon from "../ui/CameraIcon";

// Misma logica de permisos/limpieza que VoiceRecorder.jsx, adaptada a
// video en vez de audio -- el frame capturado se dibuja a un canvas y
// se convierte a blob JPEG, el padre decide que hacer con el (subirlo,
// mismo patron de MyProfile.jsx: onCapture(blob) en vez de subir aqui
// mismo, para no mezclar captura con logica de Storage/pago).
function SelfieCapture({ onCapture }) {
  const { t } = useTranslation();
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => stopStream, []);

  const startCamera = async () => {
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStreaming(true);
    } catch {
      setError(t("verification.errorCameraPermission"));
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError(t("verification.errorCameraCapture"));
          return;
        }

        stopStream();
        setStreaming(false);
        setPreviewUrl(URL.createObjectURL(blob));
        onCapture(blob);
      },
      "image/jpeg",
      0.92
    );
  };

  const retake = () => {
    setPreviewUrl(null);
    onCapture(null);
    startCamera();
  };

  return (
    <div className="selfie-capture">

      {error && <p className="checkout-error">{error}</p>}

      {previewUrl ? (

        <div className="selfie-preview">
          <img src={previewUrl} alt="" className="selfie-preview-img" />
          <button type="button" className="selfie-retake-btn" onClick={retake}>
            {t("verification.retakePhoto")}
          </button>
        </div>

      ) : streaming ? (

        <div className="selfie-camera-wrap">
          <video ref={videoRef} className="selfie-video" playsInline muted></video>
          <button type="button" className="selfie-shutter-btn" onClick={takePhoto}>
            <CameraIcon size={22} />
          </button>
        </div>

      ) : (

        <button type="button" className="selfie-start-btn" onClick={startCamera}>
          <CameraIcon size={18} /> {t("verification.openCamera")}
        </button>

      )}

      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

    </div>
  );
}

export default SelfieCapture;
