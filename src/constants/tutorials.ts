// src/constants/tutorials.ts
// Conteúdo de cada tutorial de onboarding por tela.

import type { TutorialScreenKey } from '@/hooks/useTutorial';

export interface TutorialStep {
  icon: string;
  title: string;
  body: string;
}

export const TUTORIALS: Record<TutorialScreenKey, TutorialStep[]> = {
  // ── Dashboard ────────────────────────────────────────────────
  dashboard: [
    {
      icon: '🏠',
      title: 'Bem-vindo ao Ninho!',
      body: 'Este é o seu painel principal. Aqui você vê um resumo de tudo que está acontecendo na sua família: tarefas, bebê, compras e muito mais.',
    },
    {
      icon: '📊',
      title: 'Métricas da família',
      body: 'Os cartões coloridos mostram o estado atual: tarefas pendentes, último registro do bebê, itens de compras e eventos próximos. Toque em qualquer cartão para ir direto à seção.',
    },
    {
      icon: '✨',
      title: 'Destaque do dia',
      body: 'O destaque mostra o item mais urgente do dia — uma tarefa atrasada, uma vacina chegando ou a última mamada do bebê. Fique de olho aqui!',
    },
    {
      icon: '🔔',
      title: 'Notificações',
      body: 'O sininho no topo abre as notificações da família. Você pode configurar alertas inteligentes para vacinas, tarefas e eventos do calendário.',
    },
  ],

  // ── Bebê ─────────────────────────────────────────────────────
  baby: [
    {
      icon: '👶',
      title: 'Módulo Bebê',
      body: 'Aqui você registra tudo sobre o(s) seu(s) bebê(s): alimentação, sono, fraldas, peso, altura e muito mais. Tudo em uma linha do tempo fácil de acompanhar.',
    },
    {
      icon: '🍼',
      title: 'Registro rápido',
      body: 'Use os botões coloridos no topo para registrar mamada, sono ou fralda com um único toque. O registro vai aparecer na linha do tempo automaticamente.',
    },
    {
      icon: '📈',
      title: 'Métricas do dia',
      body: 'Os indicadores mostram: total de mamadas, duração do último sono e quantas fraldas foram trocadas. Isso ajuda a identificar padrões rapidamente.',
    },
    {
      icon: '📅',
      title: 'Linha do tempo',
      body: 'Todos os registros aparecem em ordem cronológica. Role para baixo para ver o histórico e toque em "Histórico completo" para ver registros de dias anteriores.',
    },
    {
      icon: '💉',
      title: 'Vacinas',
      body: 'Quando uma vacina estiver chegando, um banner amarelo aparece no topo. Toque nele para ver a lista de vacinas e marcar as que já foram aplicadas.',
    },
  ],

  // ── Filhos (Kids) ─────────────────────────────────────────────
  kids: [
    {
      icon: '⭐',
      title: 'Módulo Filhos',
      body: 'Gerencie o desenvolvimento e a rotina das crianças maiores. Pontos, mesada, conquistas, deveres de casa e tempo de tela — tudo num lugar só.',
    },
    {
      icon: '🏆',
      title: 'Sistema de pontos',
      body: 'Cada tarefa concluída pelo filho rende pontos. Os pontos se acumulam e desbloqueiam conquistas (badges). Isso incentiva a responsabilidade de forma lúdica.',
    },
    {
      icon: '💰',
      title: 'Mesada digital',
      body: 'Configure uma mesada mensal para cada filho. Os pais podem ajustar o valor conforme as tarefas e o comportamento da semana.',
    },
    {
      icon: '📱',
      title: 'Tempo de tela',
      body: 'Defina um limite diário de tempo de tela por criança. O app registra o uso e avisa quando o limite estiver próximo ou ultrapassado.',
    },
    {
      icon: '🎒',
      title: 'App do filho',
      body: 'O botão "Entrar como filho" abre um modo especial onde a criança vê somente os próprios pontos e conquistas — sem acesso às configurações da família.',
    },
  ],

  // ── Tarefas ───────────────────────────────────────────────────
  tasks: [
    {
      icon: '✅',
      title: 'Lista de tarefas',
      body: 'Crie tarefas para qualquer membro da família. Cada tarefa pode ser atribuída a uma pessoa e tem um prazo opcional.',
    },
    {
      icon: '👆',
      title: 'Concluir com um toque',
      body: 'Toque em qualquer tarefa para marcá-la como concluída. Aparecerá um botão "Desfazer" por alguns segundos caso você toque por engano.',
    },
    {
      icon: '➕',
      title: 'Nova tarefa',
      body: 'Use o botão "+" no canto inferior direito ou o campo tracejado no final da lista para criar uma tarefa rapidamente.',
    },
    {
      icon: '👥',
      title: 'Delegar tarefas',
      body: 'Ao criar ou editar uma tarefa, você pode atribuí-la a qualquer membro da família. O avatar da pessoa aparece ao lado da tarefa.',
    },
  ],

  // ── Compras ───────────────────────────────────────────────────
  shopping: [
    {
      icon: '🛒',
      title: 'Lista de compras',
      body: 'A lista de compras é compartilhada com toda a família em tempo real. Quando alguém adiciona ou marca um item, todos veem na hora.',
    },
    {
      icon: '✏️',
      title: 'Adicionar itens',
      body: 'Digite o nome do item no campo de texto no topo e pressione "OK" ou "Enter" para adicionar. Você também pode usar o botão "+" no canto inferior.',
    },
    {
      icon: '✔️',
      title: 'Marcar como comprado',
      body: 'Toque em qualquer item para marcá-lo como comprado. O item vai para a seção "comprados" no final da lista.',
    },
    {
      icon: '🔗',
      title: 'Compartilhar lista',
      body: 'Use o botão 🔗 no topo para enviar a lista como texto pelo WhatsApp ou outro app. Administradores podem gerar um link temporário para convidados verem a lista.',
    },
  ],

  // ── Agenda ────────────────────────────────────────────────────
  agenda: [
    {
      icon: '📆',
      title: 'Agenda familiar',
      body: 'A agenda centraliza todos os compromissos da família: consultas médicas, vacinas, reuniões escolares, passeios e eventos pessoais.',
    },
    {
      icon: '📅',
      title: 'Navegar pelos dias',
      body: 'Deslize o calendário semanal no topo para navegar entre os dias. Toque em um dia para ver os eventos daquela data.',
    },
    {
      icon: '🗓️',
      title: 'Visão mensal',
      body: 'Toque no nome do mês para alternar para a visão mensal. Os dias com eventos ficam destacados para facilitar a visualização.',
    },
    {
      icon: '➕',
      title: 'Criar evento',
      body: 'Toque no botão "+" para criar um novo evento. Você pode definir título, categoria (consulta, vacina, escola...), data, horário e recorrência.',
    },
    {
      icon: '💉',
      title: 'Alertas de vacina',
      body: 'Quando uma vacina estiver próxima, um banner amarelo aparece no topo da agenda. Toque nele para ver detalhes e confirmar a aplicação.',
    },
  ],
};
