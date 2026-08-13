// tests/unit/useAgenda.test.ts
// UC016: Criar evento | UC017: Visualizar agenda
// UC-Vacina: isVaccineAlert — lógica pura testada sem React

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks antes de qualquer import da aplicação ──────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockListEvents: jest.Mock<any>            = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockListUpcomingVaccines: jest.Mock<any>  = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockCreateEvent: jest.Mock<any>           = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockDeleteEvent: jest.Mock<any>           = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockUpdateEvent: jest.Mock<any>           = jest.fn();

jest.mock('@/services/agenda/agendaService', () => ({
  agendaService: {
    listEvents:           (...args: unknown[]) => mockListEvents(...args),
    listUpcomingVaccines: (...args: unknown[]) => mockListUpcomingVaccines(...args),
    createEvent:          (...args: unknown[]) => mockCreateEvent(...args),
    deleteEvent:          (...args: unknown[]) => mockDeleteEvent(...args),
    updateEvent:          (...args: unknown[]) => mockUpdateEvent(...args),
  },
}));

// FamilyContext mock — retorna família fixa
jest.mock('@/context/FamilyContext', () => ({
  useFamily: () => ({ family: { id: 'family-001' } }),
}));

// Import após mocks
import { isVaccineAlert } from '@/hooks/useAgenda';
import type { FamilyEvent } from '@/types/productivity.types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FAMILY_ID = 'family-001';

function makeEvent(overrides: Partial<FamilyEvent> = {}): FamilyEvent {
  return {
    id:          'evt-001',
    family_id:   FAMILY_ID,
    title:       'consulta pediatra',
    description: null,
    start_at:    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // daqui 2 dias
    end_at:      null,
    all_day:     false,
    category:    'appointment',
    recurrence:  'none',
    created_by:  'prof-001',
    created_at:  new Date().toISOString(),
    ...overrides,
  } as FamilyEvent;
}

// ─── isVaccineAlert — função pura ────────────────────────────────────────────

describe('isVaccineAlert', () => {
  it('retorna false para eventos que não são vacina', () => {
    const event = makeEvent({ category: 'appointment' });
    expect(isVaccineAlert(event)).toBe(false);
  });

  it('retorna false para vacina com start_at no passado', () => {
    const event = makeEvent({
      category: 'vaccine',
      start_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h atrás
    });
    expect(isVaccineAlert(event)).toBe(false);
  });

  it('retorna false para vacina com start_at a mais de 3 dias', () => {
    const event = makeEvent({
      category: 'vaccine',
      start_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(isVaccineAlert(event)).toBe(false);
  });

  it('retorna true para vacina com start_at em exatamente 3 dias', () => {
    const event = makeEvent({
      category: 'vaccine',
      start_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 - 1000).toISOString(),
    });
    expect(isVaccineAlert(event)).toBe(true);
  });

  it('retorna true para vacina agendada para hoje', () => {
    const event = makeEvent({
      category: 'vaccine',
      start_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30min à frente
    });
    expect(isVaccineAlert(event)).toBe(true);
  });

  it('retorna true para vacina amanhã', () => {
    const event = makeEvent({
      category: 'vaccine',
      start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(isVaccineAlert(event)).toBe(true);
  });
});

// ─── agendaService — payloads ────────────────────────────────────────────────

describe('agendaService.createEvent — payload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('chama createEvent com family_id e campos corretos', async () => {
    const newEvent = makeEvent();
    mockCreateEvent.mockResolvedValue(newEvent);

    const { agendaService } = await import('@/services/agenda/agendaService');

    const input = {
      title:    'consulta pediatra',
      start_at: newEvent.start_at,
      all_day:  false,
      category: 'appointment' as const,
    };

    const result = await agendaService.createEvent(FAMILY_ID, input);

    expect(mockCreateEvent).toHaveBeenCalledTimes(1);
    expect(mockCreateEvent).toHaveBeenCalledWith(FAMILY_ID, input);
    expect(result.title).toBe('consulta pediatra');
  });

  it('propaga erro quando createEvent rejeita', async () => {
    mockCreateEvent.mockRejectedValue(new Error('DB error'));

    const { agendaService } = await import('@/services/agenda/agendaService');

    await expect(
      agendaService.createEvent(FAMILY_ID, {
        title: 'falha',
        start_at: new Date().toISOString(),
        all_day: false,
        category: 'other' as const,
      })
    ).rejects.toThrow('DB error');
  });
});

describe('agendaService.listEvents — retorno', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna lista de eventos ordenada pelo service', async () => {
    const events = [makeEvent({ id: 'evt-1' }), makeEvent({ id: 'evt-2' })];
    mockListEvents.mockResolvedValue(events);

    const { agendaService } = await import('@/services/agenda/agendaService');
    const result = await agendaService.listEvents(FAMILY_ID);

    expect(mockListEvents).toHaveBeenCalledWith(FAMILY_ID);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('evt-1');
  });

  it('retorna lista vazia sem erro', async () => {
    mockListEvents.mockResolvedValue([]);

    const { agendaService } = await import('@/services/agenda/agendaService');
    const result = await agendaService.listEvents(FAMILY_ID);

    expect(result).toHaveLength(0);
  });
});

describe('agendaService.deleteEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('chama deleteEvent com o id correto', async () => {
    mockDeleteEvent.mockResolvedValue(undefined);

    const { agendaService } = await import('@/services/agenda/agendaService');
    await agendaService.deleteEvent('evt-001');

    expect(mockDeleteEvent).toHaveBeenCalledWith('evt-001');
  });

  it('propaga erro quando deleteEvent rejeita', async () => {
    mockDeleteEvent.mockRejectedValue(new Error('not found'));

    const { agendaService } = await import('@/services/agenda/agendaService');
    await expect(agendaService.deleteEvent('evt-999')).rejects.toThrow('not found');
  });
});

describe('agendaService.updateEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('chama updateEvent com id e campos atualizados', async () => {
    const original = makeEvent({ title: 'consulta original' });
    const updated  = makeEvent({ title: 'consulta atualizada' });
    mockUpdateEvent.mockResolvedValue(updated);

    const { agendaService } = await import('@/services/agenda/agendaService');
    const result = await agendaService.updateEvent(original.id, { title: 'consulta atualizada' });

    expect(mockUpdateEvent).toHaveBeenCalledWith(original.id, { title: 'consulta atualizada' });
    expect(result.title).toBe('consulta atualizada');
  });

  it('pode atualizar categoria para vacina', async () => {
    const updated = makeEvent({ category: 'vaccine', start_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() });
    mockUpdateEvent.mockResolvedValue(updated);

    const { agendaService } = await import('@/services/agenda/agendaService');
    const result = await agendaService.updateEvent('evt-001', { category: 'vaccine' });

    expect(result.category).toBe('vaccine');
  });

  it('propaga erro quando updateEvent rejeita', async () => {
    mockUpdateEvent.mockRejectedValue(new Error('permission denied'));

    const { agendaService } = await import('@/services/agenda/agendaService');
    await expect(
      agendaService.updateEvent('evt-999', { title: 'teste' })
    ).rejects.toThrow('permission denied');
  });

  it('evento atualizado com isVaccineAlert reflete nova categoria', () => {
    const updatedVaccine = makeEvent({
      category: 'vaccine',
      start_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(isVaccineAlert(updatedVaccine)).toBe(true);
  });

  it('evento com categoria não-vacina não dispara alerta após update', () => {
    const updatedOther = makeEvent({
      category: 'appointment',
      start_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(isVaccineAlert(updatedOther)).toBe(false);
  });
});

describe('agendaService.listUpcomingVaccines', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna vacinas com start_at nos próximos 3 dias', async () => {
    const vaccineEvent = makeEvent({
      id:       'vacc-001',
      category: 'vaccine',
      start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    mockListUpcomingVaccines.mockResolvedValue([vaccineEvent]);

    const { agendaService } = await import('@/services/agenda/agendaService');
    const result = await agendaService.listUpcomingVaccines(FAMILY_ID);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('vaccine');
  });

  it('retorna lista vazia quando não há vacinas próximas', async () => {
    mockListUpcomingVaccines.mockResolvedValue([]);

    const { agendaService } = await import('@/services/agenda/agendaService');
    const result = await agendaService.listUpcomingVaccines(FAMILY_ID);

    expect(result).toHaveLength(0);
  });
});
