import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { modoDemo } from './lib/db';
import { supabase } from './lib/supabase';
import ClienteEditor from './pages/ClienteEditor';
import Clientes from './pages/Clientes';
import Analytics from './pages/Analytics';
import Financeiro from './pages/Financeiro';
import Login from './pages/Login';

export default function App() {
  const [pronto, setPronto] = useState(modoDemo);
  const [logado, setLogado] = useState(modoDemo);
  const [email, setEmail] = useState(modoDemo ? 'demo@flowizehub.com' : '');

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setLogado(Boolean(data.session));
      setEmail(data.session?.user.email ?? '');
      setPronto(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      setLogado(Boolean(sessao));
      setEmail(sessao?.user.email ?? '');
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (!pronto) {
    return <div className="tela-carregando">Carregando painel…</div>;
  }

  if (!logado) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Layout email={email} modoDemo={modoDemo}>
        <Routes>
          <Route path="/" element={<Navigate to="/clientes" replace />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/novo" element={<ClienteEditor />} />
          <Route path="/clientes/:id" element={<ClienteEditor />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/clientes" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
