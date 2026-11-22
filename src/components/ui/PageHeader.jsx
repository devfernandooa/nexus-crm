export default function PageHeader({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-5 gap-3 sm:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* Ícone em verde esmeralda com alto contraste */}
        <div className="w-9 h-9 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-2xs transition-colors [&_svg]:stroke-[2.2]">
          {icon}
        </div>

        {/* Título e Subtítulo */}
        <div className="flex flex-col min-w-0 text-left">
          <h2 className="text-lg sm:text-xl font-bold !text-slate-900 dark:!text-white leading-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs !text-slate-600 dark:!text-slate-400 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Área para botões (se houver) */}
      {action && (
        <div className="w-full md:w-auto shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}