function StepBasicInfo({ data, onChange }) {
  return (
    <div className="step-content">

      <h2>Cuéntanos sobre ti</h2>
      <p className="step-subtitle">Esta información aparecerá en tu perfil.</p>

      <label className="field-label">Nombre</label>
      <input
        type="text"
        placeholder="Tu nombre"
        value={data.name}
        onChange={(e) => onChange("name", e.target.value)}
      />

      <label className="field-label">Edad</label>
      <input
        type="number"
        placeholder="Tu edad"
        min="18"
        value={data.age}
        onChange={(e) => onChange("age", e.target.value)}
      />

      <label className="field-label">Género</label>
      <div className="option-pills">

        {["Mujer", "Hombre", "No binario"].map((option) => (
          <button
            type="button"
            key={option}
            className={`option-pill ${data.gender === option ? "selected" : ""}`}
            onClick={() => onChange("gender", option)}
          >
            {option}
          </button>
        ))}

      </div>

      <label className="field-label">Ciudad</label>
      <input
        type="text"
        placeholder="¿Dónde vives?"
        value={data.city}
        onChange={(e) => onChange("city", e.target.value)}
      />

    </div>
  );
}

export default StepBasicInfo;