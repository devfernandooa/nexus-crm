import clsx from 'clsx';
function Botao({ onClick, children, variant = 'primario', ...props }) {
    const classes = { primario: 'bg-blue-800 text-white', secundario: 'bg-gray-200 text-black' }
    return (
        <button onClick={onClick} className={clsx('p-4 rounded', classes[variant])} {...props}>
            {children}
        </button>
    );
}

export default Botao;