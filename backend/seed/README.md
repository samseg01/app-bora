# Seed — dados de um bairro piloto

O `scripts/seed.py` lê um arquivo JSON com os lugares e rolês curados **a pé** e popula o banco.
Ele existe para o passo R5 do roteiro (`../../TODO.md`): a curadoria de campo do R3 sai daqui do
caderno e entra no app sem ninguém escrever SQL na mão.

## Como usar

```bash
# com o docker compose no ar
docker compose exec api python scripts/seed.py seed/republica.json
```

O script é **idempotente por nome**: rodar duas vezes não duplica lugar nem rolê. Rodar de novo
depois de editar o JSON atualiza o que mudou.

## Os dois arquivos aqui

- **`exemplo-ficticio.json`** — dados **inventados**, da Vila Madalena, que servem só para ver o
  app preenchido em desenvolvimento. Os nomes são fictícios de propósito e o arquivo diz isso no
  próprio conteúdo. **Nunca use isto numa demonstração para alguém de fora.**
- **`republica.json`** — o bairro piloto de verdade. Nasce praticamente vazio: só se preenche com
  o que foi visto em campo. Um lugar que ninguém visitou não entra aqui.

## O formato

```json
{
  "bairro": "República",
  "curador": { "nome": "...", "email": "...", "senha": "..." },
  "lugares": [
    {
      "nome": "Bar do China",
      "categoria": "bar",
      "endereco": "Rua ...",
      "lat": -23.5xxx,
      "lng": -46.6xxx,
      "roles": [
        {
          "titulo": "...",
          "descricao": "o motivo pra ir — o que você viu lá",
          "categoria": "bar",
          "inicio": "21:00",
          "fim": "02:00"
        }
      ]
    }
  ]
}
```

`lat`/`lng` saem do Google Maps: clique com o botão direito no ponto e copie as coordenadas.
`inicio`/`fim` são horários locais de hoje — o script converte para UTC e vira um rolê do dia,
que é o que a `/descoberta` procura.

**`descricao` é o campo que importa.** É o "motivo pra ir": o que você viu que faria alguém sair
de casa. Sem ele o card do rolê é título mais horário, e é justamente o card que se mostra a um
dono de casa.

## Emails dos usuários de exemplo

Use um domínio comum (`@exemplo.com`). Domínios de uso especial como `.local` e `.test` são
**rejeitados pelo `EmailStr`** do backend — o seed grava direto no banco e passa, mas o
`POST /auth/login` recusa depois, e a conta fica inutilizável para testar o app.
