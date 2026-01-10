export default function MenuItem({ label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-11 rounded-xl px-3 text-left transition ${
        danger
          ? "text-red-300 hover:bg-red-500/10"
          : "text-white/85 hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}

