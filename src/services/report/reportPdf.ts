// src/services/report/reportPdf.ts
// Gera PDF do relatório familiar via expo-print + expo-sharing

import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { FamilyReport } from './reportService';

// ─── Palette ─────────────────────────────────────────────────

const C = {
  bg:        '#0f1117',
  card:      '#1a1d27',
  cardAlt:   '#141720',
  border:    '#252a3d',
  borderMid: '#2e3347',
  primary:   '#5b7cf6',
  primaryBg: '#1a1f3c',
  secondary: '#38bdf8',
  success:   '#22c55e',
  successBg: '#0f2918',
  amber:     '#f59e0b',
  amberBg:   '#271f0a',
  coral:     '#f97316',
  text:      '#f1f3f9',
  textSec:   '#8892a4',
  textMuted: '#4a5168',
  error:     '#f87171',
  errorBg:   '#2a1010',
};

// ─── Helpers ─────────────────────────────────────────────────

function fmtCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function cap(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function pct(value: number, total: number): number {
  return total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
}

function bar(value: number, total: number, color: string, height = 7): string {
  const p = pct(value, total);
  return `
    <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
      <div style="flex:1;background:${C.border};border-radius:99px;height:${height}px;overflow:hidden;">
        <div style="width:${p}%;height:100%;background:${color};border-radius:99px;"></div>
      </div>
      <span style="color:${C.textSec};font-size:11px;min-width:32px;text-align:right;">${p}%</span>
    </div>`;
}

function divider(): string {
  return `<div style="border-top:1px solid ${C.border};margin:10px 0;"></div>`;
}

function badge(text: string, bg: string, color: string): string {
  return `<span style="background:${bg};color:${color};border-radius:99px;padding:3px 10px;font-size:10px;font-weight:700;letter-spacing:.3px;">${text}</span>`;
}

function sectionTitle(label: string, emoji = ''): string {
  return `
    <div style="display:flex;align-items:center;gap:8px;margin:28px 0 12px;">
      ${emoji ? `<span style="font-size:14px;">${emoji}</span>` : ''}
      <span style="color:${C.textSec};font-size:10px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">${label}</span>
      <div style="flex:1;border-top:1px solid ${C.border};margin-left:4px;"></div>
    </div>`;
}

function subLabel(label: string, emoji = ''): string {
  return `<p style="color:${C.textMuted};font-size:9px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;margin:14px 0 6px;">${emoji ? emoji + ' ' : ''}${label}</p>`;
}

function statGrid(...items: Array<[string, string | number, string?]>): string {
  const cells = items
    .map(([label, val, color]) => `
      <div style="flex:1;min-width:70px;background:${C.cardAlt};border:1px solid ${C.border};border-radius:10px;
                  padding:12px 8px;text-align:center;">
        <div style="color:${color ?? C.primary};font-size:22px;font-weight:700;font-family:Georgia,serif;line-height:1.1;">${val}</div>
        <div style="color:${C.textSec};font-size:9px;text-transform:uppercase;letter-spacing:.6px;margin-top:4px;">${label}</div>
      </div>`)
    .join('');
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0;">${cells}</div>`;
}

function kpiRow(label: string, value: string | number, color = C.primary): string {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid ${C.border};">
      <span style="color:${C.textSec};font-size:12px;">${label}</span>
      <span style="color:${color};font-size:13px;font-weight:700;">${value}</span>
    </div>`;
}

function chip(text: string): string {
  return `<span style="background:${C.cardAlt};border:1px solid ${C.border};color:${C.text};border-radius:6px;padding:3px 9px;font-size:10px;margin:2px;">${text}</span>`;
}

function cardWrap(content: string, accent = false): string {
  return `
    <div style="background:${C.card};border:1px solid ${accent ? C.primary : C.border};border-radius:12px;padding:16px;margin-bottom:10px;">
      ${content}
    </div>`;
}

// ─── Seções ───────────────────────────────────────────────────

function buildSummarySection(r: FamilyReport): string {
  const taskRate = pct(r.tasks_done, r.tasks_total);
  const shopRate = pct(r.shopping_checked_items, r.shopping_total_items);
  const totalBabyLogs = r.babies.reduce((s, b) => s + b.logs_total, 0);

  return cardWrap(`
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <div style="flex:1;min-width:100px;background:${C.primaryBg};border:1px solid ${C.primary}33;border-radius:10px;padding:14px;text-align:center;">
        <div style="color:${C.primary};font-size:28px;font-weight:700;font-family:Georgia,serif;">${r.tasks_done}<span style="font-size:14px;color:${C.textSec}">/${r.tasks_total}</span></div>
        <div style="color:${C.textSec};font-size:9px;text-transform:uppercase;letter-spacing:.6px;margin-top:4px;">tarefas concluídas</div>
        ${bar(r.tasks_done, r.tasks_total, C.primary, 5)}
      </div>
      <div style="flex:1;min-width:100px;background:${C.cardAlt};border:1px solid ${C.border};border-radius:10px;padding:14px;text-align:center;">
        <div style="color:${C.secondary};font-size:28px;font-weight:700;font-family:Georgia,serif;">${totalBabyLogs}</div>
        <div style="color:${C.textSec};font-size:9px;text-transform:uppercase;letter-spacing:.6px;margin-top:4px;">registros bebê</div>
      </div>
      <div style="flex:1;min-width:100px;background:${C.cardAlt};border:1px solid ${C.border};border-radius:10px;padding:14px;text-align:center;">
        <div style="color:${C.amber};font-size:28px;font-weight:700;font-family:Georgia,serif;">${r.shopping_checked_items}<span style="font-size:14px;color:${C.textSec}">/${r.shopping_total_items}</span></div>
        <div style="color:${C.textSec};font-size:9px;text-transform:uppercase;letter-spacing:.6px;margin-top:4px;">compras feitas</div>
        ${bar(r.shopping_checked_items, r.shopping_total_items, C.amber, 5)}
      </div>
      ${r.expenses_total_cents > 0 ? `
      <div style="flex:1;min-width:100px;background:${C.cardAlt};border:1px solid ${C.border};border-radius:10px;padding:14px;text-align:center;">
        <div style="color:${C.coral};font-size:20px;font-weight:700;font-family:Georgia,serif;">${fmtCents(r.expenses_total_cents)}</div>
        <div style="color:${C.textSec};font-size:9px;text-transform:uppercase;letter-spacing:.6px;margin-top:4px;">total de gastos</div>
      </div>` : ''}
    </div>
  `);
}

function buildMembersSection(r: FamilyReport): string {
  const COLORS = [C.primary, C.secondary, C.amber, C.coral];
  return r.members
    .map((m, i) => {
      const color = COLORS[i % COLORS.length];
      const chips = [
        m.tasks_done      > 0 ? chip(`✔ ${m.tasks_done} tarefas feitas`)        : '',
        m.tasks_pending   > 0 ? chip(`⏳ ${m.tasks_pending} pendentes`)           : '',
        m.baby_logs       > 0 ? chip(`👶 ${m.baby_logs} reg. bebê`)              : '',
        m.shopping_added  > 0 ? chip(`🛒 ${m.shopping_added} itens compras`)     : '',
        m.couple_checkins > 0 ? chip(`💬 ${m.couple_checkins} check-ins do casal`) : '',
      ].filter(Boolean).join('');

      return cardWrap(`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="color:${C.text};font-size:15px;font-weight:700;">${m.member_name}</span>
          ${badge(`${m.mental_load_pct}% carga mental`, color + '22', color)}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">
          ${chips || `<span style="color:${C.textSec};font-size:11px;">Sem registros no período</span>`}
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:${C.textSec};font-size:10px;min-width:80px;">Carga mental</span>
          <div style="flex:1;background:${C.border};border-radius:99px;height:8px;overflow:hidden;">
            <div style="width:${m.mental_load_pct}%;height:100%;background:${color};border-radius:99px;"></div>
          </div>
          <span style="color:${color};font-size:11px;font-weight:700;min-width:36px;text-align:right;">${m.mental_load_points} pts</span>
        </div>
      `);
    })
    .join('');
}

function buildTasksSection(r: FamilyReport): string {
  const rate  = pct(r.tasks_done, r.tasks_total);
  const cats  = r.tasks_by_category
    .sort((a, b) => (b.done + b.pending) - (a.done + a.pending))
    .map((cat) => {
      const total = cat.done + cat.pending;
      return `
        <div style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:${C.textSec};margin-bottom:2px;">
            <span>${cap(cat.category)}</span>
            <span style="color:${C.textMuted};">${cat.done} concluídas · ${cat.pending} pendentes</span>
          </div>
          ${bar(cat.done, total, C.secondary)}
        </div>`;
    })
    .join('');

  return cardWrap(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <span style="color:${C.textSec};font-size:12px;">Conclusão geral</span>
      <span style="color:${C.primary};font-size:20px;font-weight:700;">${rate}%</span>
    </div>
    ${bar(r.tasks_done, r.tasks_total, C.primary, 9)}
    ${statGrid(['total', r.tasks_total, C.textSec], ['concluídas', r.tasks_done, C.primary], ['pendentes', r.tasks_total - r.tasks_done, C.coral])}
    ${cats ? `${subLabel('por categoria')}${cats}` : ''}
  `);
}

function buildBabiesSection(r: FamilyReport): string {
  return r.babies
    .map((b) => {
      const typeRows = b.logs_by_type
        .sort((a, x) => x.count - a.count)
        .map((t) => `
          <div style="margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:${C.textSec};margin-bottom:2px;">
              <span>${t.label}</span><span style="color:${C.textMuted};">${t.count} registro${t.count !== 1 ? 's' : ''}</span>
            </div>
            ${bar(t.count, b.logs_total, C.secondary)}
          </div>`)
        .join('');

      return cardWrap(`
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div>
            <div style="color:${C.text};font-size:15px;font-weight:700;font-family:Georgia,serif;">${b.baby_name}</div>
            ${b.birth_date ? `<div style="color:${C.textSec};font-size:11px;margin-top:2px;">Nasc.: ${new Date(b.birth_date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>` : ''}
          </div>
          ${badge(`${b.logs_total} registros`, C.primaryBg, C.primary)}
        </div>
        ${typeRows || `<span style="color:${C.textSec};font-size:11px;">Sem registros no período</span>`}
      `);
    })
    .join('');
}

function buildShoppingSection(r: FamilyReport): string {
  const rate = pct(r.shopping_checked_items, r.shopping_total_items);
  return cardWrap(`
    ${statGrid(
      ['adicionados', r.shopping_total_items, C.textSec],
      ['comprados', r.shopping_checked_items, C.amber],
      ['pendentes', r.shopping_total_items - r.shopping_checked_items, C.coral],
    )}
    ${divider()}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <span style="color:${C.textSec};font-size:12px;">Taxa de compra</span>
      <span style="color:${C.amber};font-size:16px;font-weight:700;">${rate}%</span>
    </div>
    ${bar(r.shopping_checked_items, r.shopping_total_items, C.amber, 9)}
  `);
}

function buildExpensesSection(r: FamilyReport): string {
  const rows = r.expenses_by_category
    .sort((a, b) => b.total_cents - a.total_cents)
    .map((cat) => {
      const share = pct(cat.total_cents, r.expenses_total_cents);
      return `
        <div style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:${C.textSec};margin-bottom:2px;">
            <span>${cap(cat.category)}</span>
            <span style="color:${C.textMuted};">${fmtCents(cat.total_cents)} · ${cat.count} lançamento${cat.count !== 1 ? 's' : ''} · ${share}%</span>
          </div>
          ${bar(cat.total_cents, r.expenses_total_cents, C.coral)}
        </div>`;
    })
    .join('');

  return cardWrap(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <span style="color:${C.textSec};font-size:12px;">Total do período</span>
      <span style="color:${C.coral};font-size:24px;font-weight:700;font-family:Georgia,serif;">${fmtCents(r.expenses_total_cents)}</span>
    </div>
    ${rows}
  `);
}

function buildMentalLoadSection(r: FamilyReport): string {
  const COLORS = [C.primary, C.secondary, C.amber, C.coral];
  const sorted = [...r.members].sort((a, b) => b.mental_load_points - a.mental_load_points);

  const statusBlock = r.mental_load_balanced
    ? `<div style="background:${C.successBg};border:1px solid ${C.success}44;border-radius:10px;padding:12px 14px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <span style="font-size:16px;">✅</span>
        <span style="color:${C.success};font-size:12px;font-weight:700;">Carga bem distribuída entre os membros</span>
       </div>`
    : `<div style="background:${C.errorBg};border:1px solid ${C.error}44;border-radius:10px;padding:12px 14px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <span style="font-size:16px;">⚠️</span>
        <span style="color:${C.error};font-size:12px;font-weight:700;">Desequilíbrio de ${r.mental_load_imbalance_pct}% entre os membros</span>
       </div>`;

  const rows = sorted
    .map((m, i) => {
      const color = COLORS[i % COLORS.length];
      return `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="color:${C.text};font-size:13px;font-weight:600;">${m.member_name}</span>
            <span style="color:${C.textSec};font-size:11px;">${m.mental_load_points} pts · <strong style="color:${color};">${m.mental_load_pct}%</strong></span>
          </div>
          <div style="background:${C.border};border-radius:99px;height:10px;overflow:hidden;">
            <div style="width:${m.mental_load_pct}%;height:100%;background:${color};border-radius:99px;"></div>
          </div>
        </div>`;
    })
    .join('');

  return cardWrap(`${statusBlock}${rows}`, !r.mental_load_balanced);
}

function buildChildrenSection(r: FamilyReport): string {
  return r.children
    .map((c) => {
      const hwTotal   = c.homework_done + c.homework_pending;
      const hwRate    = pct(c.homework_done, hwTotal);
      const mealTotal = c.meals_great + c.meals_ok + c.meals_refused;
      const mealRate  = pct(c.meals_great + c.meals_ok, mealTotal);

      const sections: string[] = [];

      // Tarefas e pontos
      sections.push(subLabel('Tarefas e Pontos', '✅'));
      sections.push(statGrid(
        ['feitas', c.tasks_done, C.primary],
        ['pendentes', c.tasks_pending, c.tasks_pending > 0 ? C.coral : C.textSec],
        ['pontos ganhos', c.total_points, C.amber],
      ));
      if (c.allowance_cents > 0) {
        sections.push(`
          <div style="display:flex;justify-content:space-between;align-items:center;
                      background:${C.primaryBg};border:1px solid ${C.primary}33;border-radius:10px;
                      padding:10px 14px;margin:8px 0;">
            <span style="color:${C.textSec};font-size:12px;">💰 Mesada estimada pelo período</span>
            <span style="color:${C.primary};font-size:18px;font-weight:700;font-family:Georgia,serif;">${fmtCents(c.allowance_cents)}</span>
          </div>`);
      }

      // Conquistas
      if (c.achievements_total > 0) {
        sections.push(subLabel('Conquistas', '🏆'));
        sections.push(statGrid(
          ['total de conquistas', c.achievements_total, C.amber],
          ...(c.achievements_new > 0 ? [['novas no período', c.achievements_new, C.primary] as [string, number, string]] : []),
        ));
      }

      // Deveres
      if (hwTotal > 0) {
        sections.push(subLabel('Deveres de Casa', '📚'));
        sections.push(statGrid(
          ['entregues', c.homework_done, C.success],
          ['pendentes', c.homework_pending, c.homework_pending > 0 ? C.coral : C.textSec],
        ));
        sections.push(`
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:${C.textSec};margin-top:4px;">
            <span>Taxa de entrega</span>
            <span style="color:${hwRate >= 80 ? C.success : hwRate >= 50 ? C.amber : C.coral};font-weight:700;">${hwRate}%</span>
          </div>
          ${bar(c.homework_done, hwTotal, hwRate >= 80 ? C.success : hwRate >= 50 ? C.amber : C.coral)}`);
      }

      // Alimentação
      if (mealTotal > 0) {
        sections.push(subLabel('Alimentação', '🍽️'));
        sections.push(statGrid(
          ['refeições', c.meals_total, C.textSec],
          ['comeu bem', c.meals_great, C.success],
          ['comeu ok', c.meals_ok, C.amber],
          ['recusou', c.meals_refused, C.coral],
        ));
        sections.push(`
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:${C.textSec};margin-top:4px;">
            <span>Taxa de aceitação</span>
            <span style="color:${mealRate >= 80 ? C.success : mealRate >= 50 ? C.amber : C.coral};font-weight:700;">${mealRate}%</span>
          </div>
          ${bar(c.meals_great + c.meals_ok, mealTotal, mealRate >= 80 ? C.success : mealRate >= 50 ? C.amber : C.coral)}`);
      }

      // Tempo de tela
      if (c.screen_time_avg_min > 0) {
        sections.push(subLabel('Tempo de Tela', '📱'));
        sections.push(statGrid(
          ['média por dia (min)', c.screen_time_avg_min, C.secondary],
          ...(c.screen_time_over_limit_days > 0
            ? [['dias acima do limite', c.screen_time_over_limit_days, C.coral] as [string, number, string]]
            : [['dias dentro do limite', '✓', C.success] as [string, string, string]]),
        ));
        if (c.screen_time_over_limit_days > 0) {
          sections.push(`
            <div style="background:${C.errorBg};border:1px solid ${C.error}33;border-radius:8px;padding:10px 12px;margin-top:6px;font-size:11px;color:${C.error};">
              ⚠️ ${c.screen_time_over_limit_days} dia${c.screen_time_over_limit_days !== 1 ? 's' : ''} ultrapassaram o limite combinado de tempo de tela.
            </div>`);
        }
      }

      return cardWrap(`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <span style="color:${C.text};font-size:17px;font-weight:700;font-family:Georgia,serif;">${c.child_name}</span>
          ${badge(`${c.total_points} pts`, C.amberBg, C.amber)}
        </div>
        ${sections.join('')}
      `);
    })
    .join('');
}

// ─── HTML completo ───────────────────────────────────────────

function buildHtml(r: FamilyReport): string {
  const babiesBlock     = r.babies.length > 0 && r.babies.some((b) => b.logs_total > 0)
    ? `${sectionTitle('Bebês', '👶')}${buildBabiesSection(r)}`
    : '';
  const shoppingBlock   = r.shopping_total_items > 0
    ? `${sectionTitle('Lista de Compras', '🛒')}${buildShoppingSection(r)}`
    : '';
  const expensesBlock   = r.expenses_total_cents > 0
    ? `${sectionTitle('Gastos do Casal', '💳')}${buildExpensesSection(r)}`
    : '';
  const childrenBlock   = r.children.length > 0
    ? `${sectionTitle('Filhos', '🧒')}${buildChildrenSection(r)}`
    : '';

  const genDate = new Date(r.generated_at).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const periodCap = r.period_label.charAt(0).toUpperCase() + r.period_label.slice(1);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Relatório ${r.family_name} — ${periodCap}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: ${C.bg};
      color: ${C.text};
      font-family: -apple-system, 'Segoe UI', Helvetica, sans-serif;
      font-size: 13px;
      line-height: 1.55;
      padding: 28px 24px 40px;
      max-width: 700px;
      margin: 0 auto;
    }
    h1 { font-family: Georgia, serif; font-size: 26px; color: ${C.text}; margin: 0; }
    h2 { font-family: Georgia, serif; font-size: 15px; color: ${C.textSec}; margin: 0; }
  </style>
</head>
<body>

  <!-- ── Cabeçalho ── -->
  <div style="background:${C.card};border:1px solid ${C.borderMid};border-radius:14px;padding:22px 20px;margin-bottom:6px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
      <div>
        <h1>${r.family_name}</h1>
        <h2 style="margin-top:4px;">📅 ${periodCap}</h2>
      </div>
      <div style="text-align:right;">
        <div style="color:${C.primary};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;">Relatório Familiar</div>
        <div style="color:${C.textMuted};font-size:10px;margin-top:4px;">Gerado em ${genDate}</div>
      </div>
    </div>
  </div>

  <!-- ── Visão Geral ── -->
  ${sectionTitle('Visão Geral', '📊')}
  ${buildSummarySection(r)}

  <!-- ── Contribuição por Membro ── -->
  ${sectionTitle('Contribuição por Membro', '👥')}
  ${buildMembersSection(r)}

  <!-- ── Tarefas ── -->
  ${sectionTitle('Tarefas', '✅')}
  ${buildTasksSection(r)}

  <!-- ── Bebês ── -->
  ${babiesBlock}

  <!-- ── Compras ── -->
  ${shoppingBlock}

  <!-- ── Gastos ── -->
  ${expensesBlock}

  <!-- ── Carga Mental ── -->
  ${sectionTitle('Equilíbrio de Carga Mental', '⚖️')}
  ${buildMentalLoadSection(r)}

  <!-- ── Filhos ── -->
  ${childrenBlock}

  <!-- ── Rodapé ── -->
  <div style="margin-top:36px;padding-top:14px;border-top:1px solid ${C.border};
              text-align:center;color:${C.textMuted};font-size:10px;line-height:1.6;">
    Gerado pelo <strong style="color:${C.textSec};">Ninho</strong> · ${genDate}<br/>
    Este relatório é confidencial e destinado exclusivamente à família ${r.family_name}.
  </div>

</body>
</html>`;
}

// ─── Exportação pública ──────────────────────────────────────

/**
 * Gera o PDF do relatório e abre o share sheet do sistema.
 *
 * expo-print salva o arquivo em um diretório temporário do sistema
 * que o expo-sharing não tem permissão de ler diretamente no iOS.
 * A solução é copiar para FileSystem.cacheDirectory antes de compartilhar.
 */
export async function exportReportPdf(report: FamilyReport): Promise<boolean> {
  const html = buildHtml(report);

  // 1. Gera o PDF num dir temporário do print
  const { uri: printUri } = await Print.printToFileAsync({ html, base64: false });

  // 2. Copia para o cacheDirectory (acessível pelo expo-sharing)
  const filename = `relatorio-${report.family_name.replace(/\s+/g, '-')}-${report.period_label.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  const destUri  = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.copyAsync({ from: printUri, to: destUri });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    // Fallback: abre preview de impressão (iOS/Android)
    await Print.printAsync({ uri: destUri });
    return true;
  }

  await Sharing.shareAsync(destUri, {
    mimeType:    'application/pdf',
    dialogTitle: `Relatório ${report.family_name} — ${report.period_label}`,
    UTI:         'com.adobe.pdf',
  });
  return true;
}
