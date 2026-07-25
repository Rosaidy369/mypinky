import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import SuccessCheck from "../components/ui/SuccessCheck";
import "../styles/Legal.css";

function Contact() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setErrorMsg("");

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("support_messages").insert({
      user_id: user?.id ?? null,
      name: form.name,
      email: form.email,
      message: form.message,
    });

    setSending(false);

    if (error) {
      console.error("Error enviando mensaje de soporte:", error.message);
      setErrorMsg("No se pudo enviar tu mensaje. Intenta de nuevo.");
      return;
    }

    setSent(true);
  };

  return (
    <div className="legal-page">

      <div className="legal-content">

        <h1>Contacto</h1>
        <p className="legal-updated">¿Tienes dudas o comentarios? Escríbenos.</p>

        {sent ? (

          <div className="contact-success">
            <div className="contact-success-icon"><SuccessCheck size={50} /></div>
            <h2>¡Mensaje enviado!</h2>
            <p>Te responderemos lo antes posible.</p>
          </div>

        ) : (

          <form className="contact-form" onSubmit={handleSubmit}>

            <label className="field-label">Nombre</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />

            <label className="field-label">Correo electrónico</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />

            <label className="field-label">Mensaje</label>
            <textarea
              rows={5}
              required
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
            />

            {errorMsg && <p className="contact-error">{errorMsg}</p>}

            <button type="submit" className="contact-submit-btn" disabled={sending}>
              {sending ? "Enviando..." : "Enviar mensaje"}
            </button>

          </form>

        )}

      </div>

    </div>
  );
}

export default Contact;