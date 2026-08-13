// src/services/report/reportPdf.ts
// Gera PDF do relatório familiar via expo-print + expo-sharing

import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { FamilyReport } from './reportService';

// ─── Helpers internos ────────────────────────────────────────

function fmtCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function cap(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function bar(pct: number, color: string): string {
  const clamped = Math.min(100, Math.max(0, pct));
  return `
    <div style="background:#2a3d52;border-radius:4px;height:8px;overflow:hidden;margin-top:4px;">
      <div style="width:${clamped}%;height:100%;background:${color};border-radius:4px;"></div>
    </div>`;
}

function statGrid(...items: Array<[string, string | number]>): string {
  const cells = items
    .map(
      ([label, val]) => `
      <div style="flex:1;min-width:80px;background:#16283d;border:1px solid #2a3d52;border-radius:8px;
                  padding:12px 8px;text-align:center;">
        <div style="color:#e8720c;font-size:22px;font-weight:700;">${val}</div>
        <div style="color:#f5d9b0;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-top:2px;">${label}</div>
      </div>`,
    )
    .join('');
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;">${cells}</div>`;
}

function sectionTitle(label: string): string {
  return `<h3 style="color:#f0b429;font-size:11px;text-transform:uppercase;letter-spacing:.8px;
                     margin:24px 0 8px;border-bottom:1px solid #2a3d52;padding-bottom:6px;">${label}</h3>`;
}

function subLabel(label: string): string {
  return `<p style="color:#f5d9b0;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin:12px 0 4px;">${label}</p>`;
}

// ─── Seções individuais ──────────────────────────────────────

function buildMembersSection(r: FamilyReport): string {
  const COLORS = ['#e8720c', '#f0b429', '#f5d9b0'];
  return r.members
    .map((m, i) => {
      const chips = [
        m.tasks_done       > 0 ? `✔ ${m.tasks_done} feitas`       : '',
        m.tasks_pending    > 0 ? `⏳ ${m.tasks_pending} pendentes` : '',
        m.baby_logs        > 0 ? `👶 ${m.baby_logs} reg. bebê`    : '',
        m.shopping_added   > 0 ? `🛒 ${m.shopping_added} compras` : '',
        m.couple_checkins  > 0 ? `💬 ${m.couple_checkins} check-ins` : '',
      ]
        .filter(Boolean)
        .map(
          (c) =>
            `<span style="background:#0d1b2a;border:1px solid #2a3d52;border-radius:4px;
                          padding:2px 8px;font-size:10px;color:#fdf6ec;margin:2px;">${c}</span>`,
        )
        .join('');
      const color = COLORS[i % COLORS.length];
      return `
        <div style="background:#16283d;border:1px solid #2a3d52;border-radius:10px;padding:14px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="color:#fdf6ec;font-size:14px;font-weight:600;">${m.member_name}</span>
            <span style="background:${color}22;color:${color};border-radius:99px;padding:2px 10px;
                         font-size:10px;font-weight:600;">${m.mental_load_pct}% carga</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">${chips || '<span style="color:#f5d9b0;font-size:10px;">Sem registros no período</span>'}</div>
          ${bar(m.mental_load_pct, color)}
        </div>`;
    })
    .join('');
}

function buildTasksSection(r: FamilyReport): string {
  const total = r.tasks_total;
  const rate  = total > 0 ? Math.round((r.tasks_done / total) * 100) : 0;
  let cats = '';
  for (const cat of r.tasks_by_category) {
    const catTotal = cat.done + cat.pending;
    const catRate  = catTotal > 0 ? Math.round((cat.done / catTotal) * 100) : 0;
    cats += `
      <div style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#f5d9b0;">
          <span>${cap(cat.category)}</span><span>${cat.done}/${catTotal}</span>
        </div>
        ${bar(catRate, '#f0b429')}
      </div>`;
  }
  return `
    <div style="background:#16283d;border:1px solid #2a3d52;border-radius:10px;padding:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="color:#fdf6ec;font-size:13px;">Taxa de conclusão</span>
        <span style="color:#e8720c;font-size:16px;font-weight:700;">${rate}%</span>
      </div>
      ${bar(rate, '#e8720c')}
      ${cats ? `<div style="margin-top:12px;">${cats}</div>` : ''}
    </div>`;
}

function buildBabiesSection(r: FamilyReport): string {
  if (r.babies.length === 0) return '';
  return r.babies
    .map((b) => {
      const typeRows = b.logs_by_type
        .sort((a, x) => x.count - a.count)
        .map(
          (t) => `
          <div style="margin-bottom:5px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#f5d9b0;">
              <span>${t.label}</span><span>${t.count} reg.</span>
            </div>
            ${bar(b.logs_total > 0 ? Math.round((t.count / b.logs_total) * 100) : 0, '#f0b429')}
          </div>`,
        )
        .join('');
      return `
        <div style="background:#16283d;border:1px solid #2a3d52;border-radius:10px;padding:14px;margin-bottom:8px;">
          <div style="color:#fdf6ec;font-size:14px;font-weight:600;margin-bottom:2px;">${b.baby_name}</div>
          ${b.birth_date ? `<div style="color:#f5d9b0;font-size:11px;margin-bottom:10px;">Nascimento: ${new Date(b.birth_date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>` : ''}
          ${statGrid(['total de registros', b.logs_total])}
          ${typeRows}
        </div>`;
    })
    .join('');
}

function buildShoppingSection(r: FamilyReport): string {
  const rate = r.shopping_total_items > 0
    ? Math.round((r.shopping_checked_items / r.shopping_total_items) * 100)
    : 0;
  return `
    <div style="background:#16283d;border:1px solid #2a3d52;border-radius:10px;padding:14px;">
      ${statGrid(['adicionados', r.shopping_total_items], ['comprados', r.shopping_checked_items])}
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#fdf6ec;margin-top:8px;">
        <span>Itens comprados</span>
        <span style="color:#e8720c;font-weight:700;">${rate}%</span>
      </div>
      ${bar(rate, '#e8720c')}
    </div>`;
}

function buildExpensesSection(r: FamilyReport): string {
  if (r.expenses_total_cents === 0) return '';
  const rows = r.expenses_by_category
    .sort((a, b) => b.total_cents - a.total_cents)
    .map(
      (cat) => `
      <div style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#f5d9b0;">
          <span>${cap(cat.category)}</span>
          <span>${fmtCents(cat.total_cents)} · ${cat.count}x</span>
        </div>
        ${bar(Math.round((cat.total_cents / r.expenses_total_cents) * 100), '#f0b429')}
      </div>`,
    )
    .join('');
  return `
    <div style="background:#16283d;border:1px solid #2a3d52;border-radius:10px;padding:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="color:#f5d9b0;font-size:12px;">Total</span>
        <span style="color:#e8720c;font-size:20px;font-weight:700;">${fmtCents(r.expenses_total_cents)}</span>
      </div>
      ${rows}
    </div>`;
}

function buildMentalLoadSection(r: FamilyReport): string {
  const COLORS = ['#e8720c', '#f0b429'];
  const sorted = [...r.members].sort((a, b) => b.mental_load_points - a.mental_load_points);
  const badge = r.mental_load_balanced
    ? `<div style="background:#22c55e18;color:#22c55e;border-radius:8px;padding:8px 12px;
                   font-size:12px;font-weight:600;margin-bottom:10px;">✓ Carga bem distribuída</div>`
    : `<div style="background:#e8720c18;color:#e8720c;border-radius:8px;padding:8px 12px;
                   font-size:12px;font-weight:600;margin-bottom:10px;">⚠ Desequilíbrio de ${r.mental_load_imbalance_pct}%</div>`;
  const rows = sorted
    .map(
      (m, i) => `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#fdf6ec;margin-bottom:3px;">
          <span>${m.member_name}</span>
          <span style="color:#f5d9b0;">${m.mental_load_points} pts · ${m.mental_load_pct}%</span>
        </div>
        ${bar(m.mental_load_pct, COLORS[i % COLORS.length])}
      </div>`,
    )
    .join('');
  return `
    <div style="background:#16283d;border:1px solid #2a3d52;border-radius:10px;padding:14px;">
      ${badge}${rows}
    </div>`;
}

function buildChildrenSection(r: FamilyReport): string {
  if (r.children.length === 0) return '';
  return r.children
    .map((c) => {
      const hwTotal     = c.homework_done + c.homework_pending;
      const hwRate      = hwTotal > 0 ? Math.round((c.homework_done / hwTotal) * 100) : 0;
      const mealTotal   = c.meals_great + c.meals_ok + c.meals_refused;
      const mealRate    = mealTotal > 0 ? Math.round(((c.meals_great + c.meals_ok) / mealTotal) * 100) : 0;

      const sections: string[] = [];

      // Tarefas e pontos
      sections.push(subLabel('Tarefas e pontos'));
      sections.push(statGrid(
        ['feitas', c.tasks_done],
        ['pendentes', c.tasks_pending],
        ['pontos', c.total_points],
      ));
      if (c.allowance_cents > 0) {
        sections.push(`
          <div style="display:flex;justify-content:space-between;align-items:center;
                      background:#0d1b2a;border:1px solid #2a3d52;border-radius:8px;
                      padding:10px 12px;margin:6px 0;">
            <span style="color:#f5d9b0;font-size:12px;">Mesada estimada</span>
            <span style="color:#e8720c;font-size:16px;font-weight:700;">${fmtCents(c.allowance_cents)}</span>
          </div>`);
      }

      // Conquistas
      if (c.achievements_total > 0) {
        sections.push(subLabel('Conquistas'));
        sections.push(statGrid(
          ['total', c.achievements_total],
          ...(c.achievements_new > 0 ? [['no período', c.achievements_new] as [string, number]] : []),
        ));
      }

      // Deveres
      if (hwTotal > 0) {
        sections.push(subLabel('Deveres de casa'));
        sections.push(statGrid(['entregues', c.homework_done], ['pendentes', c.homework_pending]));
        sections.push(`
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#fdf6ec;margin-top:4px;">
            <span>Taxa de entrega</span><span style="color:#e8720c;font-weight:700;">${hwRate}%</span>
          </div>
          ${bar(hwRate, '#e8720c')}`);
      }

      // Alimentação
      if (mealTotal > 0) {
        sections.push(subLabel('Alimentação'));
        sections.push(statGrid(
          ['registros', c.meals_total],
          ['comeu bem', c.meals_great],
          ['recusou', c.meals_refused],
        ));
        sections.push(`
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#fdf6ec;margin-top:4px;">
            <span>Taxa de aceitação</span><span style="color:#e8720c;font-weight:700;">${mealRate}%</span>
          </div>
          ${bar(mealRate, '#e8720c')}`);
      }

      // Tempo de tela
      if (c.screen_time_avg_min > 0) {
        sections.push(subLabel('Tempo de tela'));
        sections.push(statGrid(
          ['média/dia (min)', c.screen_time_avg_min],
          ...(c.screen_time_over_limit_days > 0
            ? [['dias c/ excesso', c.screen_time_over_limit_days] as [string, number]]
            : []),
        ));
        if (c.screen_time_over_limit_days > 0) {
          sections.push(`
            <div style="background:#e8720c18;color:#e8720c;border-radius:8px;padding:8px 12px;
                        font-size:11px;margin-top:6px;">
              ⚠ ${c.screen_time_over_limit_days} dia(s) ultrapassaram o limite combinado.
            </div>`);
        }
      }

      return `
        <div style="background:#16283d;border:1px solid #2a3d52;border-radius:10px;padding:14px;margin-bottom:8px;">
          <div style="color:#fdf6ec;font-size:15px;font-weight:600;margin-bottom:12px;">${c.child_name}</div>
          ${sections.join('')}
        </div>`;
    })
    .join('');
}

// ─── HTML completo ───────────────────────────────────────────

function buildHtml(r: FamilyReport): string {
  const babiesBlock =
    r.babies.length > 0
      ? `${sectionTitle('Bebês')}${buildBabiesSection(r)}`
      : '';
  const shoppingBlock =
    r.shopping_total_items > 0
      ? `${sectionTitle('Lista de compras')}${buildShoppingSection(r)}`
      : '';
  const expensesBlock =
    r.expenses_total_cents > 0
      ? `${sectionTitle('Gastos do casal')}${buildExpensesSection(r)}`
      : '';
  const childrenBlock =
    r.children.length > 0
      ? `${sectionTitle('Filhos')}${buildChildrenSection(r)}`
      : '';

  const genDate = new Date(r.generated_at).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Relatório ${r.family_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1b2a;
      color: #fdf6ec;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      font-size: 13px;
      line-height: 1.5;
      padding: 24px 20px;
      max-width: 680px;
      margin: 0 auto;
    }
    h1 { font-family: Georgia, serif; font-size: 24px; color: #fdf6ec; margin-bottom: 2px; }
    h2 { font-family: Georgia, serif; font-size: 15px; color: #f5d9b0; margin-bottom: 4px; }
  </style>
</head>
<body>
  <!-- Cabeçalho -->
  <div style="background:#16283d;border:1px solid #2a3d52;border-radius:10px;padding:18px;margin-bottom:4px;">
    <h1>${r.family_name}</h1>
    <h2>🗓 ${cap(r.period_label)}</h2>
    <p style="color:#f5d9b0;font-size:10px;margin-top:6px;">Gerado em ${genDate}</p>
  </div>

  <!-- Visão geral -->
  ${sectionTitle('Visão geral')}
  ${statGrid(
    ['tarefas', r.tasks_total],
    ['concluídas', r.tasks_done],
    ['bebê(s)', r.babies.reduce((s, b) => s + b.logs_total, 0)],
    ['compras', r.shopping_total_items],
    ['gastos', fmtCents(r.expenses_total_cents)],
  )}

  <!-- Membros -->
  ${sectionTitle('Contribuição por membro')}
  ${buildMembersSection(r)}

  <!-- Tarefas -->
  ${sectionTitle('Tarefas')}
  ${buildTasksSection(r)}

  <!-- Bebês -->
  ${babiesBlock}

  <!-- Compras -->
  ${shoppingBlock}

  <!-- Gastos -->
  ${expensesBlock}

  <!-- Carga mental -->
  ${sectionTitle('Equilíbrio de carga mental')}
  ${buildMentalLoadSection(r)}

  <!-- Filhos -->
  ${childrenBlock}

  <p style="color:#2a3d52;font-size:10px;text-align:center;margin-top:32px;border-top:1px solid #2a3d52;padding-top:12px;">
    Gerado pelo Ninho · ${genDate}
  </p>
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
  const filename = `relatorio-${report.family_name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
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
    dialogTitle: `Relatório ${report.family_name}`,
    UTI:         'com.adobe.pdf',
  });
  return true;
}
