import { useTranslation } from "react-i18next";
import { PROMPT_QUESTIONS } from "../../data/profileOptions";
import { promptQuestionLabel } from "../../lib/profileLabels";

// `isEditing` distinguishes the onboarding wizard from being reused inside
// MyProfile.jsx's edit form — "add this later from your profile" makes no
// sense when the person is already there editing.
function StepPrompts({ prompts, onChange, isEditing = false }) {
  const { t } = useTranslation();

  const updateSlot = (index, field, value) => {
    const updated = [...prompts];
    if (!updated[index]) updated[index] = { question: "", answer: "" };
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="step-content">

      <h2>{t("onboarding.prompts.heading")}</h2>
      <p className="step-subtitle">
        {t("onboarding.prompts.subtitle")}
        {!isEditing && t("onboarding.prompts.subtitleOptional")}
      </p>

      {[0, 1].map((index) => {
        const prompt = prompts[index] || { question: "", answer: "" };
        const usedElsewhere = prompts
          .filter((_, i) => i !== index)
          .map((p) => p.question);

        return (
          <div className="prompt-slot" key={index}>

            <label className="field-label">{t("onboarding.prompts.questionLabel", { index: index + 1 })}</label>

            <select
              value={prompt.question}
              onChange={(e) => updateSlot(index, "question", e.target.value)}
            >
              <option value="">{t("onboarding.prompts.choosePrompt")}</option>
              {PROMPT_QUESTIONS.filter((code) => !usedElsewhere.includes(code)).map((code) => (
                <option key={code} value={code}>{promptQuestionLabel(t, code)}</option>
              ))}
            </select>

            {prompt.question && (
              <textarea
                placeholder={t("onboarding.prompts.answerPlaceholder")}
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
