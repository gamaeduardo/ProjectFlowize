import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

function traduzir(mensagem: string): string {
  if (/invalid login credentials/i.test(mensagem)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(mensagem)) return 'Confirme o e-mail antes de entrar.';
  if (/rate limit/i.test(mensagem)) return 'Muitas tentativas. Espere um minuto e tente de novo.';
  return mensagem;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    if (!supabase) return;

    setErro('');
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setCarregando(false);

    if (error) setErro(traduzir(error.message));
  }

  return (
    <div className="login">
      <form className="login-cartao" onSubmit={entrar}>
        <span className="marca">
          <span className="marca-simbolo" aria-hidden="true">
            F
          </span>
          Flowize
          <span className="marca-tag">painel</span>
        </span>

        <h1>Entrar no painel</h1>
        <p>Acesso restrito à equipe Flowize.</p>

        {erro && <div className="aviso aviso-erro">{erro}</div>}

        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        <button className="btn btn-primario btn-bloco" type="submit" disabled={carregando}>
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="login-rodape">flowizehub.com · admin</p>
      </form>
    </div>
  );
}
