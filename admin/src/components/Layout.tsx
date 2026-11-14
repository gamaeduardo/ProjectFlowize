import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Props {
  email: string;
  modoDemo: boolean;
  children: ReactNode;
}

export default function Layout({ email, modoDemo, children }: Props) {
  const navegar = useNavigate();

  async function sair() {
    if (!supabase) {
      navegar('/');
      return;
    }
    await supabase.auth.signOut();
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-interno">
          <Link className="marca" to="/clientes" aria-label="Flowize — clientes">
            <span className="marca-simbolo" aria-hidden="true">
              F
            </span>
            Flowize
            <span className="marca-tag">painel</span>
          </Link>

          <nav className="nav" aria-label="Seções do painel">
            <NavLink to="/clientes">Clientes</NavLink>
            <NavLink to="/financeiro">Financeiro</NavLink>
          </nav>

          <div className="topbar-conta">
            <a className="btn btn-fantasma btn-pequeno" href="https://flowizehub.com" target="_blank" rel="noopener">
              Ver site ↗
            </a>
            <span>{email}</span>
            <button className="btn btn-contorno btn-pequeno" type="button" onClick={sair}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="conteudo">
        {modoDemo && (
          <div className="aviso-demo">
            <strong>Modo demonstração.</strong>
            <span>
              Sem Supabase configurado, os dados ficam no seu navegador. Preencha{' '}
              <code>admin/.env</code> para usar o banco de verdade.
            </span>
          </div>
        )}
        {children}
      </main>
    </>
  );
}
