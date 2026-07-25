const ALL_INTERESTS = [
  "☕ Café", "🎵 Música", "✈️ Viajar", "🎬 Películas", "🏖 Playa",
  "🐶 Perros", "📚 Lectura", "🎨 Arte", "🍕 Pizza", "📸 Fotografía",
  "🏋️ Gym", "🎮 Videojuegos", "🥂 Vida nocturna", "🧘 Yoga", "🍳 Cocina"
];

function StepInterests({ selected, onToggle }) {
  return (
    <div className="step-content">

      <h2>Tus intereses</h2>
      <p className="step-subtitle">
        Elige al menos 3 (puedes elegir más).
      </p>

      <div className="interest-grid">

        {ALL_INTERESTS.map((interest) => (
          <button
            type="button"
            key={interest}
            className={`interest-chip ${selected.includes(interest) ? "selected" : ""}`}
            onClick={() => onToggle(interest)}
          >
            {interest}
          </button>
        ))}

      </div>

    </div>
  );
}

export default StepInterests;