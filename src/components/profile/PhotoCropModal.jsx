import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

function PhotoCropModal({ imageSrc, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || saving) return;
    setSaving(true);
    try {
      await onConfirm(croppedAreaPixels);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crop-modal-backdrop">
      <div className="crop-modal">

        <h2>Ajusta tu foto</h2>
        <p className="crop-modal-subtitle">Mueve y haz zoom para encuadrar tu foto</p>

        <div className="crop-modal-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <input
          type="range"
          className="crop-zoom-slider"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />

        <div className="crop-modal-actions">
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="confirm-btn" onClick={handleConfirm} disabled={saving}>
            {saving ? "Subiendo..." : "Confirmar"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default PhotoCropModal;
