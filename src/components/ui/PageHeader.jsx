export default function PageHeader({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex items-center gap-3">
        {/* Ícone com fundo azul */}
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 font-bold">
          {icon}
        </div>
        {/* Título e Subtítulo empilhados no mobile, lado a lado no desktop */}
        <div className="flex flex-col md:flex-col md:items-baseline">
          <h2 className="text-lg font-bolder !text-slate-900 dark:!text-white leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs !text-slate-500 dark:!text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Área para botões (se houver) */}
      {action && (
        <div className="w-full md:w-auto">
          {action}
        </div>
      )}
    </div>
  );
}