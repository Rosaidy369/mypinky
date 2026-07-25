const MOODS = [
  { label: "💬 Quiero conversar", desc: "Conocer gente y platicar" },
  { label: "😂 Quiero reír", desc: "Pasar un buen rato" },
  { label: "☕ Busco compañía", desc: "Alguien con quien salir" },
  { label: "🌙 No puedo dormir", desc: "Charlas nocturnas" },
];

function StepLookingFor({ mood, onChange }) {
  return (
    <div className="step-content">

      <h2>¿Qué estás buscando?</h2>
      <p className="step-subtitle">Esto ayuda a encontrarte con personas afines.</p>

      <div className="mood-options">

        {MOODS.map((option) => (
          <button
            type="button"
            key={option.label}
            className={`mood-option ${mood === option.label ? "selected" : ""}`}
            onClick={() => onChange(option.label)}
          >
            <span className="mood-option-title">{option.label}</span>
            <span className="mood-option-desc">{option.desc}</span>
          </button>
        ))}

      </div>

    </div>
  );
}

export default StepLookingFor;