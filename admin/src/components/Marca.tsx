interface Props {
  /** Tag extra ao lado do nome, como "painel". */
  tag?: string;
}

/** Marca da Flowize: anel + barra com camadas cromáticas. */
export default function Marca({ tag }: Props) {
  return (
    <span className="marca">
      <span className="marca-simbolo" aria-hidden="true">
        <svg viewBox="0 0 40 40" role="presentation">
          <g className="camada ciano">
            <circle cx="20" cy="20" r="11" />
            <rect x="3" y="17" width="34" height="6" rx="3" />
          </g>
          <g className="camada magenta">
            <circle cx="20" cy="20" r="11" />
            <rect x="3" y="17" width="34" height="6" rx="3" />
          </g>
          <g className="camada preta">
            <circle cx="20" cy="20" r="11" />
            <rect x="3" y="17" width="34" height="6" rx="3" />
          </g>
          <g className="particulas">
            <rect className="p-ciano" x="1" y="7" width="3" height="1.3" rx="0.65" />
            <rect className="p-magenta" x="35" y="10" width="4" height="1.3" rx="0.65" />
            <rect className="p-magenta" x="2" y="31" width="2.4" height="1.3" rx="0.65" />
            <rect className="p-ciano" x="33" y="33" width="4" height="1.3" rx="0.65" />
          </g>
        </svg>
      </span>
      <span className="marca-nome">Flowize</span>
      {tag && <span className="marca-tag">{tag}</span>}
    </span>
  );
}
