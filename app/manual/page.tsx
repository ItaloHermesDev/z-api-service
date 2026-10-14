import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { requirePage } from "@/lib/auth";
import { canSeePage } from "@/lib/pages";

const chapters = [
  { id: "acesso", title: "Acesso" },
  { id: "chave", title: "Secret Key" },
  { id: "painel", title: "Painel" },
  { id: "canais", title: "Canais" },
  { id: "templates", title: "Templates" },
  { id: "conversas", title: "Conversas" },
  { id: "gastos", title: "Gastos" },
  { id: "rotas", title: "Rotas" },
  { id: "usuarios", title: "Usuários" },
  { id: "caminho", title: "Ordem de uso" },
];

export default function ManualPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Carregando manual…</p>}>
      <ManualScreen />
    </Suspense>
  );
}

async function ManualScreen() {
  const user = await requirePage("manual");

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Manual</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Este texto explica cada aba do Omini Z Service: para que serve, o que
        preencher e o que o painel faz com essa informação. Os formulários de
        criar e editar abrem em uma janela. Escape ou o fundo escuro fecham a
        janela enquanto nada está sendo enviado.
      </p>
      <nav className="mt-6 flex flex-wrap gap-2">
        {chapters.map((chapter) => (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            className="rounded-full border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
          >
            {chapter.title}
          </a>
        ))}
      </nav>

      <div className="mt-4">
        <Chapter id="acesso" title="Acesso">
          <p>
            A tela de entrar pede e-mail e senha. A primeira conta do sistema é
            o administrador e o cadastro público fecha depois dela. As pessoas
            seguintes entram por um usuário criado na aba Usuários.
          </p>
          <p>
            O administrador vê todas as abas. No nível personalizado, você
            escolhe o nome do nível e marca as páginas daquela pessoa. O menu
            mostra só o que foi marcado. Quem não tem nenhuma página cai em uma
            tela de sem acesso.
          </p>
          <p>
            No computador, as abas ficam na faixa horizontal. No celular, as
            três barrinhas abrem essas abas num painel que entra da esquerda
            para a direita, e a marca dessa faixa é só o símbolo. O seu nome
            fica à direita e abre o e-mail, o nível e a opção Sair. Sair
            encerra a sessão neste navegador.
          </p>
        </Chapter>

        <Chapter id="chave" title="Secret Key">
          <p>
            O painel fala com a Omni pelo servidor. A chave fica em{" "}
            <Code>OMNI_SECRET_KEY</Code> dentro de <Code>.env.local</Code>.
            Depois de salvar o arquivo, reinicie o painel para a chave valer.
            Ela não aparece em nenhuma tela.
          </p>
          <p>
            Canais, Templates, Conversas e Rotas mostram um aviso enquanto a
            chave está vazia. Os botões de criar abrem mesmo assim, e o envio
            fica desligado até a chave existir. Com a chave no servidor, o aviso
            muda para confirmar que as chamadas já podem sair.
          </p>
        </Chapter>

        <Chapter
          id="painel"
          title="Painel"
          href={canSeePage(user, "painel") ? "/" : undefined}
        >
          <p>
            É a primeira tela depois do login. Mostra o seu nome, o e-mail, o
            nome do nível de acesso e se a Secret Key já está no servidor.
          </p>
          <p>
            Use esta aba para confirmar em qual conta você entrou e se o painel
            já consegue chamar a Omni.
          </p>
        </Chapter>

        <Chapter
          id="canais"
          title="Canais"
          href={canSeePage(user, "canais") ? "/canais" : undefined}
        >
          <p>
            Um canal é o número ou o perfil por onde as mensagens saem. Nesta
            conta, a Omni não cria o canal pela API: isso exige o papel
            ENTERPRISE. Crie o canal no painel da Omni e use Registrar canal para
            colar o identificador, junto com o nome e o tipo:
          </p>
          <ul>
            <li>WhatsApp oficial (Meta)</li>
            <li>WhatsApp Web</li>
            <li>Instagram</li>
            <li>Messenger</li>
            <li>Telegram</li>
          </ul>
          <p>
            Conversas e Rotas passam a oferecer os canais registrados. Registrar
            o identificador não conecta o número: a conexão continua no painel da
            Omni.
          </p>
          <p>
            Templates oficiais de WhatsApp usam o canal do tipo WhatsApp oficial
            e a conta da Meta ligada a essa chave.
          </p>
        </Chapter>

        <Chapter
          id="templates"
          title="Templates"
          href={canSeePage(user, "templates") ? "/templates" : undefined}
        >
          <p>
            Template é a mensagem pronta da API oficial do WhatsApp. A Meta
            analisa o texto antes de liberar o envio. Esta aba cria o template e
            mostra a situação: em análise, aprovado ou recusado. Se a Meta
            recusar, o motivo aparece debaixo da situação.
          </p>
          <p>No botão Novo template, preencha:</p>
          <ul>
            <li>
              Nome em letras minúsculas, números e sublinhado, como{" "}
              <Code>confirmacao_pedido</Code>.
            </li>
            <li>Categoria Utilidade ou Marketing.</li>
            <li>
              Idioma: português do Brasil, português de Portugal, inglês ou
              espanhol.
            </li>
            <li>
              Texto. Uma variável entra como <Code>{"{{cliente}}"}</Code> ou{" "}
              <Code>{"{{1}}"}</Code>. Cada variável pede um exemplo, porque a
              Meta analisa o modelo com esse exemplo.
            </li>
            <li>Rodapé, se quiser. O rodapé fica sem variável.</li>
          </ul>
          <p>
            O envio do formulário espera a Secret Key e uma conta oficial de
            WhatsApp. Se houver mais de uma conta, o seletor Conta WhatsApp
            escolhe qual lista ver. O botão de atualizar consulta a Meta de novo
            e refresca em análise, aprovado e recusado.
          </p>
          <p>
            Só um template aprovado entra no disparo de Conversas e na rota de
            disparo. Um template em análise ou recusado continua visível nesta
            tabela e fica de fora desses envios.
          </p>
        </Chapter>

        <Chapter
          id="conversas"
          title="Conversas"
          href={canSeePage(user, "interacoes") ? "/interacoes" : undefined}
        >
          <p>
            Cada conversa junta um telefone e um canal. A lista da esquerda
            mostra o número, o template que abriu a conversa e um trecho da
            última mensagem. À direita, o fio começa com o template inicial e
            segue com os disparos seguintes e as respostas.
          </p>
          <p>
            O botão Disparar template pede o identificador do canal, o telefone
            com DDI e DDD, só números, e um template aprovado. Se o texto tiver
            variáveis, cada uma ganha um campo. O disparo abre a conversa e
            guarda qual template a iniciou. Um segundo template para o mesmo
            número e o mesmo canal continua na mesma conversa. O primeiro
            template permanece como o que iniciou.
          </p>
          <p>
            As bolhas separam o que aconteceu: a faixa tracejada é o template, a
            faixa verde é uma mensagem enviada e a faixa cinza é o que o contato
            mandou. O botão de atualizar relê a lista.
          </p>
          <p>
            Para as respostas aparecerem, cadastre na Omni o endereço mostrado
            em Receber as conversas. Esse endereço precisa ser público. Um
            painel em localhost não recebe o evento da Omni. Se{" "}
            <Code>OMNI_WEBHOOK_TOKEN</Code> estiver definido no servidor, a Omni
            precisa enviar esse segredo. A resposta entra na conversa quando já
            existe um disparo para aquele telefone e canal.
          </p>
        </Chapter>

        <Chapter
          id="gastos"
          title="Gastos"
          href={canSeePage(user, "gastos") ? "/gastos" : undefined}
        >
          <p>
            Esta aba soma o que o próprio painel disparou. Cada linha é um
            template e um idioma. O gasto da linha é a quantidade de envios
            vezes o preço da categoria. Os cartões do topo somam todos os envios
            e todos os valores.
          </p>
          <p>
            O botão Definir preços abre os valores em reais de Marketing,
            Utilidade, Autenticação e Sem categoria. Eles começam em zero, então
            a tabela pode listar envios com gasto zerado até você gravar um
            preço. O valor aceita vírgula ou ponto e fica guardado em centavos.
          </p>
          <p>
            O preço é o que você escolhe para a sua conta neste painel. A
            categoria vem do template no momento do disparo. Um disparo antigo,
            feito antes dessa informação existir, entra como Sem categoria.
          </p>
        </Chapter>

        <Chapter
          id="rotas"
          title="Rotas"
          href={canSeePage(user, "rotas") ? "/rotas" : undefined}
        >
          <p>
            Uma rota é um endereço público que outro sistema pode chamar. O
            botão Nova rota pede um nome e um tipo. Cada rota nasce com um
            endereço <Code>/api/rotas/…</Code> e um token. Quem chama envia{" "}
            <Code>Authorization: Bearer</Code> seguido do token, ou o token na
            query <Code>?token=</Code>. Excluir pede confirmação e apaga a rota
            e as mensagens guardadas nela.
          </p>
          <h3>Receber mensagens</h3>
          <p>
            O identificador do canal é opcional. Se você informar o canal, a
            chave estiver no servidor e o painel estiver num endereço público, o
            painel tenta registrar esse endereço na Omni para os eventos de
            mensagem recebida e de status. O registro automático na Omni pede o
            plano que libera webhooks. Se a Omni recusar, a rota continua criada:
            copie o endereço e o token e cadastre os dois no canal, no painel da
            Omni.
          </p>
          <p>
            Cada chamada guarda o telefone, se a mensagem foi recebida ou
            enviada, e um resumo. A rota mostra as cinco últimas. Se aquele
            telefone já tiver conversa neste painel, a mesma mensagem também
            entra no fio de Conversas.
          </p>
          <h3>Disparar template</h3>
          <p>
            A rota fica presa a um canal e a um template. Com templates
            aprovados visíveis, o formulário lista esses templates. Sem a lista,
            você informa nome, idioma e categoria à mão. O corpo do template
            define as variáveis que a chamada precisa mandar.
          </p>
          <p>
            O outro sistema envia um POST em JSON com o telefone e as variáveis.
            Exemplo:{" "}
            <Code>{`{"phone":"5511999999999","variables":{"1":"Ana"}}`}</Code>.
            O painel dispara o template, devolve o identificador da mensagem,
            abre ou continua a conversa e soma o envio em Gastos. Se faltar uma
            variável, a resposta explica qual campo falta e o template não sai.
          </p>
        </Chapter>

        <Chapter
          id="usuarios"
          title="Usuários"
          href={user.isAdmin ? "/usuarios" : undefined}
        >
          <p>
            Esta aba aparece para o administrador. Ela cria as contas e define o
            que cada pessoa vê.
          </p>
          <p>
            No botão Novo usuário, preencha nome, e-mail e senha, escolha um
            ícone para o avatar e defina o nível:
          </p>
          <ul>
            <li>Admin vê todas as abas, inclusive Usuários.</li>
            <li>
              Personalizado pede um nome para o nível e a marcação das páginas.
              O nome Admin fica reservado. É preciso marcar pelo menos uma
              página. A pessoa entra e vê somente essas abas.
            </li>
          </ul>
          <p>
            A tabela lista o ícone, o nome, o e-mail, o nível e as páginas. O
            mesmo ícone aparece na conta, no canto da faixa. Editar abre a
            mesma janela, com a senha em branco para manter a senha atual.
            Excluir
            fica dentro dessa edição e pede confirmação. A própria conta e o
            último administrador permanecem no painel.
          </p>
          <p>
            Uma página nova, como este Manual, entra sozinha no menu do
            administrador. Para um usuário personalizado, marque a página de
            novo na edição da conta.
          </p>
        </Chapter>

        <Chapter id="caminho" title="Ordem de uso">
          <ol>
            <li>Coloque a Secret Key no servidor e reinicie o painel.</li>
            <li>Crie o canal e conecte o número no painel da Omni.</li>
            <li>Crie o template e espere a situação Aprovado.</li>
            <li>Defina o preço de cada categoria em Gastos.</li>
            <li>
              Dispare pela aba Conversas, ou crie uma rota de disparo para outro
              sistema chamar.
            </li>
            <li>
              Publique o endereço de receber, na aba Conversas ou numa rota de
              receber, para as respostas entrarem no fio.
            </li>
          </ol>
        </Chapter>
      </div>
    </>
  );
}

function Chapter({
  id,
  title,
  href,
  children,
}: {
  id: string;
  title: string;
  href?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-black/10 pt-8 dark:border-white/10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {href ? (
          <Link
            href={href}
            className="text-sm font-medium text-teal-800 hover:underline dark:text-teal-300"
          >
            Abrir aba
          </Link>
        ) : null}
      </div>
      <div className="mt-4 flex max-w-3xl flex-col gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300 [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-zinc-950 dark:[&_h3]:text-zinc-100 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[0.9em]">{children}</code>;
}
