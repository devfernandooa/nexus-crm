import clsx from 'clsx';

export default function Botao({ children, variant = 'primario', className, ...props }) {
  const classes = {
    primario: 'bg-orange-500 text-white hover:bg-orange-600 font-semibold',
    secundario: 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 font-semibold',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'
  };

  return (
    <button
      className={clsx('px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2', classes[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}


