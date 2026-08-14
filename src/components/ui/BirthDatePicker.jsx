import { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/BirthDatePicker.css";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_AGE = 18;
const MAX_AGE = 100;

// Only years that already put someone at 18+ are listed, so an underage
// year literally can't be picked -- free UX win on top of the real
// server-side CHECK constraint on profiles.birth_date.
const YEARS = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => CURRENT_YEAR - MIN_AGE - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function daysInMonth(month, year) {
  if (!month) return 31;
  return new Date(year || CURRENT_YEAR, month, 0).getDate();
}

function parseValue(value) {
  if (!value) return { day: null, month: null, year: null };
  const [year, month, day] = value.split("-").map(Number);
  return { day, month, year };
}

function BirthDatePicker({ value, onChange, disabled = false }) {
  const { t } = useTranslation();
  // Each select's pick is tracked locally so it visibly sticks the moment
  // it's chosen -- deriving all three straight from `value` would reset
  // every select back to its placeholder after picking just one, since
  // the parent only ever gets a non-null value once day+month+year are
  // ALL picked (see updateLocal below).
  const [local, setLocal] = useState(() => parseValue(value));

  // "Adjusting state when a prop changes" (React's own recommended pattern
  // for this) instead of an effect -- lets a genuine external date (e.g.
  // prefilled after an async profile load finishes) sync in during render,
  // without an extra render-then-effect-then-rerender round trip. It never
  // fights the user's own in-progress picks, since onChange(null) while
  // incomplete never turns into a truthy `value` coming back down.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (value) setLocal(parseValue(value));
  }

  const updateLocal = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);

    if (next.day && next.month && next.year) {
      const dd = String(next.day).padStart(2, "0");
      const mm = String(next.month).padStart(2, "0");
      onChange(`${next.year}-${mm}-${dd}`);
    } else {
      onChange(null);
    }
  };

  const days = Array.from({ length: daysInMonth(local.month, local.year) }, (_, i) => i + 1);
  const clampedDay = local.day && local.day > days.length ? null : local.day;

  return (
    <div className="birth-date-picker">

      <select
        value={clampedDay || ""}
        onChange={(e) => updateLocal({ day: Number(e.target.value) || null })}
        disabled={disabled}
      >
        <option value="">{t("birthDatePicker.day")}</option>
        {days.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      <select
        value={local.month || ""}
        onChange={(e) => updateLocal({ month: Number(e.target.value) || null })}
        disabled={disabled}
      >
        <option value="">{t("birthDatePicker.month")}</option>
        {MONTHS.map((m) => <option key={m} value={m}>{t(`birthDatePicker.months.${m}`)}</option>)}
      </select>

      <select
        value={local.year || ""}
        onChange={(e) => updateLocal({ year: Number(e.target.value) || null })}
        disabled={disabled}
      >
        <option value="">{t("birthDatePicker.year")}</option>
        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>

    </div>
  );
}

export default BirthDatePicker;
