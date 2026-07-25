function ProgressBar({ step, totalSteps }) {
  const percent = (step / totalSteps) * 100;

  return (
    <div className="progress-wrapper">

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }}></div>
      </div>

      <span className="progress-label">
        Paso {step} de {totalSteps}
      </span>

    </div>
  );
}

export default ProgressBar;