/** Campo de formulario com rotulo e mensagem de erro, usado nas duas telas publicas. */
export default function Campo({ id, label, erro, ...props }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <input id={id} className={`field__control ${erro ? 'field__control--error' : ''}`} {...props} />
      {erro && <span className="field__error">{erro}</span>}
    </div>
  );
}
