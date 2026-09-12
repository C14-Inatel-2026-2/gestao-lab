import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <div>
        <h1>Pagina nao encontrada</h1>
        <p className="muted">O endereco acessado nao existe ou foi movido.</p>
        <p style={{ marginTop: 'var(--space-4)' }}>
          <Link to="/" className="btn btn--primary">
            Voltar ao painel
          </Link>
        </p>
      </div>
    </div>
  );
}
