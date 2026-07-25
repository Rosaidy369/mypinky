import PROMPT_OPTIONS from "../../data/promptOptions";

function StepPrompts({ prompts, onChange }) {
  const updateSlot = (index, field, value) => {
    const updated = [...prompts];
    if (!updated[index]) updated[index] = { question: "", answer: "" };
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="step-content">

      <h2>Preguntas rompehielo</h2>
      <p className="step-subtitle">
        Elige hasta 2 preguntas y respóndelas para que otras personas te conozcan mejor.
        Este paso es opcional, puedes agregarlo después desde tu perfil.
      </p>

      {[0, 1].map((index) => {
        const prompt = prompts[index] || { question: "", answer: "" };
        const usedElsewhere = prompts
          .filter((_, i) => i !== index)
          .map((p) => p.question);

        return (
          <div className="prompt-slot" key={index}>

            <label className="field-label">Pregunta {index + 1}</label>

            <select
              value={prompt.question}
              onChange={(e) => updateSlot(index, "question", e.target.value)}
            >
              <option value="">Elige una pregunta</option>
              {PROMPT_OPTIONS.filter((q) => !usedElsewhere.includes(q)).map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>

            {prompt.question && (
              <textarea
                placeholder="Tu respuesta..."
                rows={3}
                maxLength={150}
                value={prompt.answer}
                onChange={(e) => updateSlot(index, "answer", e.target.value)}
              />
            )}

          </div>
        );
      })}

    </div>
  );
}

export default StepPrompts;