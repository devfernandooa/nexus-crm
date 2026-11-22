export default function NexusBrand({ className = '' }) {
    return (
        <div className={`inline-flex items-center justify-center gap-2.5 select-none ${className}`}>
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-extrabold text-base sm:text-lg flex items-center justify-center shadow-2xs transition-colors shrink-0">
                N
            </span>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                Nexus <span className="text-emerald-600 dark:text-emerald-400">Hub</span>
            </span>
        </div>
    );
}