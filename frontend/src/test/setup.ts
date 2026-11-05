import '@testing-library/jest-dom/vitest';
import { cleanup, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, expect } from 'vitest';
import { useCalendarStore } from '../stores/calendarStore';
import { useSessionStore } from '../stores/sessionStore';
import { useTodoFilterStore } from '../stores/todoFilterStore';
import { resetDb } from './handlers';
import { activeClients } from './renderWithProviders';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

beforeEach(() => {
  // 테스트마다 스토어·가짜 백엔드 초기화(TP-05)
  useTodoFilterStore.setState(useTodoFilterStore.getInitialState(), true);
  useCalendarStore.setState(useCalendarStore.getInitialState(), true);
  useSessionStore.setState(useSessionStore.getInitialState(), true);
  resetDb();
});

afterEach(async () => {
  // 진행 중 요청이 다음 테스트의 초기화된 DB·스토어에 닿지 않게 끝날 때까지 기다린다
  for (const qc of activeClients) {
    await waitFor(() => expect(qc.isFetching() + qc.isMutating()).toBe(0));
    qc.clear();
  }
  activeClients.clear();
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
