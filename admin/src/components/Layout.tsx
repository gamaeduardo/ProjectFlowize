import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Marca from './Marca';
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
          <Link className="marca-link" to="/clientes" aria-label="Flowize — clientes">
            <Marca tag="painel" />
          </Link>

          <nav className="nav" aria-label="Seções do painel">
            <NavLink to="/clientes">Clientes</NavLink>
            <NavLink to="/leads">Leads</NavLink>
            <NavLink to="/financeiro">Financeiro</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
          </nav>

          <div className="topbar-conta">
            <a className="btn btn-fantasma btn-pequeno" href="https://flowizehub.com" target="_blank" rel="noopener">
              Ver site ↗
            </a>
            <span className="topbar-email">{email}</span>
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
