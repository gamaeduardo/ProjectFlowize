-- Flowize — clientes de demonstração (opcional).
-- Rode depois da migration. Reexecutar não duplica nada (on conflict do slug).

insert into public.clients (
  slug, nome, slogan, pacote, status,
  whatsapp, instagram, endereco, maps_url,
  tempo, taxa, horario, pagamentos,
  cores, categorias,
  analytics_website_id, dia_vencimento, valor_mensal, paid_until, notas
)
values
  (
    'lanchonete-da-ana', 'Lanchonete da Ana', 'Lanches artesanais', 'simples', 'teste',
    '5511999999999', null, null, null,
    null, 5, $json${"abre":"17:00","fecha":"23:00"}$json$::jsonb, array['Pix', 'Cartão na entrega', 'Dinheiro'],
    $json${"destaque":"#1f7a4d","textoDestaque":"#ffffff","fundo":"#ffffff","texto":"#1d1d1b","superficie":"#eef4f0"}$json$::jsonb, $json$[{"nome":"Lanches","itens":[{"nome":"X-Burguer","desc":"Pão, hambúrguer, queijo e salada","preco":18},{"nome":"X-Bacon","desc":"Pão, hambúrguer, queijo e bacon","preco":22}]},{"nome":"Bebidas","itens":[{"nome":"Refrigerante lata","preco":6},{"nome":"Suco natural","opcoes":[["300ml",7],["500ml",10]]}]}]$json$::jsonb,
    null, 10, null, null, 'Cliente de demonstração'
  ),
  (
    'pizzaria-do-joao', 'Pizzaria do João', 'Forno a lenha de verdade', 'completo', 'teste',
    '5511999999999', null, 'Rua das Acácias, 120 · Vila Nova, São Paulo', null,
    '35–45 min', 6, $json${"abre":"18:00","fecha":"23:30"}$json$::jsonb, array['Pix', 'Cartão na entrega', 'Dinheiro'],
    $json${"destaque":"#d62828","textoDestaque":"#ffffff","capa":"#1c1210"}$json$::jsonb, $json$[{"nome":"Pizzas","itens":[{"nome":"Calabresa","destaque":1,"desc":"Molho de tomate, mussarela, calabresa fatiada e cebola roxa.","opcoes":[["Média",38],["Grande",48]],"arte":{"tipo":"pizza","cores":["#b5342b","#e9e3d0"],"fundo":"#f6dcc0"}},{"nome":"Portuguesa","destaque":1,"desc":"Presunto, ovo, cebola, ervilha e azeitona.","opcoes":[["Média",42],["Grande",52]],"arte":{"tipo":"pizza","cores":["#e58f8f","#fff3c4","#3a2a1d","#7fa23c"],"fundo":"#e9eadb"}},{"nome":"Pistache","destaque":1,"desc":"Creme de pistache, mussarela de búfala e mel.","opcoes":[["Média",54],["Grande",68]],"arte":{"tipo":"pizza","cores":["#8fb339","#dbe8a6"],"fundo":"#f1e8c8"}},{"nome":"Marguerita","desc":"Mussarela, tomate fresco, manjericão e azeite.","opcoes":[["Média",36],["Grande",46]],"arte":{"tipo":"pizza","cores":["#d94a3a","#2f7d3b"],"fundo":"#f6dcc0"}}]},{"nome":"Bebidas","itens":[{"nome":"Coca-Cola 2L","preco":12,"desc":"Gelada.","arte":{"tipo":"lata","cores":["#c8102e","#ffffff"],"fundo":"#f4d9d9"}},{"nome":"Guaraná 2L","preco":10,"desc":"Gelado.","arte":{"tipo":"lata","cores":["#1f8a3d","#f5c518"],"fundo":"#d9ecd9"}},{"nome":"Suco de laranja 500ml","preco":9,"desc":"Feito na hora.","arte":{"tipo":"copo","cores":["#f59a1b","#2f7d3b"],"fundo":"#fbe7c4"}}]},{"nome":"Sobremesas","itens":[{"nome":"Pizza de chocolate","preco":24,"desc":"Broto com granulado.","arte":{"tipo":"doce","cores":["#f3e3cf","#e6b8c8","#fff"],"fundo":"#ead9cf"}}]}]$json$::jsonb,
    null, 10, null, null, 'Cliente de demonstração'
  )
on conflict (slug) do nothing;
