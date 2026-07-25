const MAX_LENGTH = 300;

function StepBio({ bio, onChange }) {
  return (
    <div className="step-content">

      <h2>Escribe tu biografía</h2>
      <p className="step-subtitle">
        Cuenta algo sobre ti que llame la atención.
      </p>

      <textarea
        placeholder="Ej: Amante del café, los viajes y las buenas conversaciones..."
        maxLength={MAX_LENGTH}
        value={bio}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
      />

      <span className="char-counter">
        {bio.length}/{MAX_LENGTH}
      </span>

    </div>
  );
}

export default StepBio;