import { useState } from 'react';
import Cabecalho from './Cabecalho';
import DispositivosPage from './DispositivosPage';
import EmprestimosPage from './EmprestimosPage';

/** Area autenticada: cabecalho fixo e a secao escolhida nas abas. */
export default function Area() {
  const [aba, setAba] = useState('inventario');

  return (
    <div className="app">
      <Cabecalho aba={aba} onTrocarAba={setAba} />
      <main className="conteudo">
        {aba === 'inventario' ? <DispositivosPage /> : <EmprestimosPage />}
      </main>
    </div>
  );
}
