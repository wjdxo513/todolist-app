import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CalendarView } from '../../../stores/calendarStore';
import { useCalendarStore } from '../../../stores/calendarStore';
import { API, db, err, makeTodo, statusOf } from '../../../test/handlers';
import { renderApp } from '../../../test/renderWithProviders';
import { server } from '../../../test/server';

const TODAY = '2026-11-04';

function seedSn12() {
  return {
    A: makeTodo({ title: 'A', startDate: '2026-11-02', endDate: '2026-11-04', categoryId: 2 }),
    B: makeTodo({ title: 'B', startDate: '2026-11-06', endDate: '2026-11-10' }),
    C: makeTodo({ title: 'C', startDate: '2026-10-28', endDate: '2026-11-03' }),
  };
}

/** 마지막 캘린더 요청의 쿼리 */
const lastCalendarQuery = () => {
  const reqs = db.requests.filter((r) => r.path === '/todos/calendar');
  return Object.fromEntries(new URLSearchParams(reqs.at(-1)?.search));
};

function open(view: CalendarView = 'month', baseDate = TODAY) {
  useCalendarStore.setState({ view, baseDate });
  return renderApp('/calendar');
}

const title = () => screen.getByRole('heading', { level: 2 });
const bars = (name: string) => screen.getAllByRole('button', { name: new RegExp(`^${name}, `) });
const slotColumn = (bar: HTMLElement) => (bar.parentElement as HTMLElement).style.gridColumn;
const rowOf = (el: HTMLElement) => el.closest('.week') as HTMLElement;
const dayCell = (date: string) => screen.getByRole('button', { name: `${date} 일 보기` });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 4, 12, 0));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('FE-14 캘린더 틀·일 뷰', () => {
  it('일 뷰는 기준일 범위와 today로 요청하고 항목을 제목·카테고리·기간·배지로 표시한다', async () => {
    seedSn12();
    const { queryClient } = open('day');
    const list = await screen.findByRole('list', { name: '이 날짜의 할일' });
    expect(lastCalendarQuery()).toEqual({ from: TODAY, to: TODAY, today: TODAY });
    const keys = queryClient
      .getQueryCache()
      .findAll({ queryKey: ['calendar'] })
      .map((q) => q.queryKey);
    expect(keys).toContainEqual(['calendar', { from: TODAY, to: TODAY, today: TODAY }]);

    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(1); // SN-12: A만, B·C 미표시
    expect(items[0]).toHaveTextContent('A');
    expect(await within(items[0]).findByText('업무')).toBeInTheDocument(); // 카테고리 이름은 별도 조회
    expect(items[0]).toHaveTextContent('11-02 ~ 11-04');
    expect(items[0]).toHaveTextContent('진행중');
  });

  it('범위 제목 형식과 뷰 전환 시 기준일 유지(4.7, WA-17)', async () => {
    const { user } = open();
    expect(await screen.findByText('이 기간에 할일이 없습니다.')).toBeInTheDocument();
    expect(title()).toHaveTextContent('2026년 11월');
    expect(screen.getByRole('radio', { name: '월' })).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('radio', { name: '주' }));
    expect(title()).toHaveTextContent('2026.11.01 ~ 11.07');
    expect(screen.getByRole('radio', { name: '주' })).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('radio', { name: '일' }));
    expect(title()).toHaveTextContent('2026.11.04 (수)');

    await user.click(screen.getByRole('radio', { name: '월' }));
    expect(title()).toHaveTextContent('2026년 11월');
    expect(useCalendarStore.getState().baseDate).toBe(TODAY);
  });

  it('[<] [>]는 뷰 단위로 이동해 새 범위로 다시 요청하고 [오늘]은 오늘 범위로 돌아온다', async () => {
    const { user } = open();
    await screen.findByText('이 기간에 할일이 없습니다.');

    await user.click(screen.getByRole('button', { name: '다음 달' }));
    expect(title()).toHaveTextContent('2026년 12월');
    await vi.waitFor(() =>
      expect(lastCalendarQuery()).toEqual({ from: '2026-12-01', to: '2026-12-31', today: TODAY }),
    );

    await user.click(screen.getByRole('button', { name: '이전 달' }));
    await user.click(screen.getByRole('button', { name: '이전 달' }));
    expect(title()).toHaveTextContent('2026년 10월');
    await vi.waitFor(() =>
      expect(lastCalendarQuery()).toMatchObject({ from: '2026-10-01', to: '2026-10-31' }),
    );

    await user.click(screen.getByRole('button', { name: '오늘' }));
    expect(title()).toHaveTextContent('2026년 11월');

    await user.click(screen.getByRole('radio', { name: '주' }));
    await user.click(screen.getByRole('button', { name: '다음 주' }));
    expect(title()).toHaveTextContent('2026.11.08 ~ 11.14');
    await vi.waitFor(() =>
      expect(lastCalendarQuery()).toMatchObject({ from: '2026-11-08', to: '2026-11-14' }),
    );

    await user.click(screen.getByRole('radio', { name: '일' }));
    await user.click(screen.getByRole('button', { name: '오늘' }));
    await user.click(screen.getByRole('button', { name: '이전 날' }));
    expect(title()).toHaveTextContent('2026.11.03 (화)');
    await vi.waitFor(() =>
      expect(lastCalendarQuery()).toMatchObject({ from: '2026-11-03', to: '2026-11-03' }),
    );
    await user.click(screen.getByRole('button', { name: '다음 날' }));
    expect(title()).toHaveTextContent('2026.11.04 (수)');
  });

  it('일 뷰 항목 클릭은 SC-06 편집 경로로 이동한다(WA-16)', async () => {
    const { A } = seedSn12();
    const { user, router } = open('day');
    await user.click(await screen.findByRole('button', { name: 'A' }));
    expect(router.state.location.pathname).toBe(`/todos/${A.id}/edit`);
  });

  it('항목이 없으면 빈 문구, 조회 실패 시 상단 오류 영역(5.6, 5.4)', async () => {
    open('day');
    expect(await screen.findByText('이 날짜에 할일이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('조회 실패 시 본문 상단 오류 영역이 표시된다', async () => {
    server.use(http.get(`${API}/todos/calendar`, () => err(500, 'INTERNAL_ERROR', '서버 오류')));
    open('month');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '처리하지 못했습니다. 다시 시도해 주세요.',
    );
    expect(screen.queryByText('이 기간에 할일이 없습니다.')).not.toBeInTheDocument();
  });

  it('완료된 할일은 완료 배지로 표시된다(SN-12 3a)', async () => {
    makeTodo({ title: 'A', startDate: '2026-11-02', endDate: '2026-11-04', isCompleted: true });
    open('day');
    const list = await screen.findByRole('list', { name: '이 날짜의 할일' });
    expect(within(list).getByText('완료', { exact: false })).toHaveTextContent('(v) 완료');
  });
});

describe('FE-15 월 뷰', () => {
  it('SN-12: C는 11-01~11-03, B는 두 주 행, A는 11-02~11-04 막대', async () => {
    seedSn12();
    open('month');
    const [c] = await screen.findAllByRole('button', { name: /^C, / });
    expect(bars('C')).toHaveLength(1);
    expect(c).toHaveAccessibleName('C, 기한 초과, 2026-10-28~2026-11-03');
    expect(slotColumn(c)).toBe('1 / span 3');
    expect(c).toHaveClass('contLeft');
    expect(
      within(rowOf(c)).getByRole('button', { name: '2026-11-01 일 보기' }),
    ).toBeInTheDocument();

    const [b1, b2] = bars('B');
    expect(bars('B')).toHaveLength(2);
    expect(slotColumn(b1)).toBe('6 / span 2');
    expect(b1).toHaveClass('contRight');
    expect(
      within(rowOf(b1)).getByRole('button', { name: '2026-11-06 일 보기' }),
    ).toBeInTheDocument();
    expect(slotColumn(b2)).toBe('1 / span 3');
    expect(b2).toHaveClass('contLeft');
    expect(b2).not.toHaveClass('contRight');
    expect(
      within(rowOf(b2)).getByRole('button', { name: '2026-11-08 일 보기' }),
    ).toBeInTheDocument();

    const [a] = bars('A');
    expect(slotColumn(a)).toBe('2 / span 3');
    expect(a).toHaveTextContent('A');
    expect(lastCalendarQuery()).toEqual({ from: '2026-11-01', to: '2026-11-30', today: TODAY });
  });

  it('상태 4종 막대는 서로 다른 선 모양·배지 모양이다(WA-19)', async () => {
    const todos = [
      makeTodo({ title: 'T1', startDate: '2026-11-10', endDate: '2026-11-12' }),
      makeTodo({ title: 'T2', startDate: '2026-11-03', endDate: '2026-11-05' }),
      makeTodo({ title: 'T3', startDate: '2026-11-03', endDate: '2026-11-05', isCompleted: true }),
      makeTodo({ title: 'T4', startDate: '2026-11-01', endDate: '2026-11-02' }),
    ];
    expect(todos.map((t) => statusOf(t, TODAY))).toEqual([
      '시작 전',
      '진행중',
      '완료',
      '기한 초과',
    ]);
    open('month');
    await screen.findAllByRole('button', { name: /^T1, / });
    const expected = [
      ['T1', 'todo', '( )'],
      ['T2', 'progress', '(>)'],
      ['T3', 'done', '(v)'],
      ['T4', 'overdue', '(!)'],
    ];
    for (const [name, tone, shape] of expected) {
      const [bar] = bars(name);
      expect(bar).toHaveClass('bar', tone);
      expect(bar).toHaveTextContent(shape);
    }
    expect(within(bars('T3')[0]).getByText('T3')).toHaveAttribute('data-done');
  });

  it("오늘 칸에 '(오늘)' 표시가 있다", async () => {
    open('month');
    await screen.findByText('이 기간에 할일이 없습니다.');
    expect(within(dayCell(TODAY)).getByText('(오늘)')).toBeInTheDocument();
    expect(screen.getAllByText('(오늘)')).toHaveLength(1);
  });

  it('날짜 칸 클릭 → 그 날짜의 일 뷰', async () => {
    seedSn12();
    const { user } = open('month');
    await screen.findAllByRole('button', { name: /^B, / });
    await user.click(dayCell('2026-11-10'));
    expect(title()).toHaveTextContent('2026.11.10 (화)');
    expect(screen.getByRole('radio', { name: '일' })).toHaveAttribute('aria-checked', 'true');
    expect(await screen.findByRole('button', { name: 'B' })).toBeInTheDocument();
  });

  it('데스크톱 막대 클릭 → SC-06 편집 경로', async () => {
    const { B } = seedSn12();
    const { user, router } = open('month');
    const [b2] = (await screen.findAllByRole('button', { name: /^B, / })).slice(1);
    await user.click(b2);
    expect(router.state.location.pathname).toBe(`/todos/${B.id}/edit`);
  });

  it('[+N건] 클릭 → 그 날짜의 일 뷰(WA-18)', async () => {
    for (let i = 1; i <= 4; i++)
      makeTodo({ title: `X${i}`, startDate: '2026-11-10', endDate: '2026-11-10' });
    const { user } = open('month');
    await user.click(await screen.findByRole('button', { name: '+1건' }));
    expect(title()).toHaveTextContent('2026.11.10 (화)');
    const list = await screen.findByRole('list', { name: '이 날짜의 할일' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('모바일 막대는 제목 없이 모양+선만, 탭하면 일 뷰(WA-16)', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
    }));
    seedSn12();
    const { user, router } = open('month');
    const [, b2] = await screen.findAllByRole('button', { name: /^B, / });
    expect(b2).not.toHaveTextContent('B');
    expect(b2).toHaveTextContent('( )');
    await user.click(b2);
    expect(router.state.location.pathname).toBe('/calendar');
    expect(title()).toHaveTextContent('2026.11.08 (일)'); // 이 막대 구간의 시작일
  });

  it('범위 내 할일이 없으면 그리드를 유지하고 빈 문구를 표시한다(5.6)', async () => {
    makeTodo({ title: '12월', startDate: '2026-12-02', endDate: '2026-12-03' });
    open('month');
    expect(await screen.findByText('이 기간에 할일이 없습니다.')).toBeInTheDocument();
    expect(dayCell('2026-11-01')).toBeInTheDocument();
    expect(dayCell('2026-11-30')).toBeInTheDocument();
    expect(dayCell('2026-12-05')).toHaveAttribute('data-outside');
    expect(screen.queryByRole('button', { name: /^12월, / })).not.toBeInTheDocument();
  });
});

describe('FE-16 주 뷰', () => {
  it('2026-11-01~11-07 일요일 시작 7열 헤더', async () => {
    open('week');
    await screen.findByText('이 기간에 할일이 없습니다.');
    const cells = screen.getAllByRole('button', { name: / 일 보기$/ });
    expect(cells.map((c) => c.getAttribute('aria-label'))).toEqual(
      ['01', '02', '03', '04', '05', '06', '07'].map((d) => `2026-11-${d} 일 보기`),
    );
    expect(cells[0]).toHaveTextContent('일 11/01');
    expect(cells[6]).toHaveTextContent('토 11/07');
    expect(lastCalendarQuery()).toEqual({ from: '2026-11-01', to: '2026-11-07', today: TODAY });
  });

  it('SN-12: B는 11-06~11-07에만, 끝 이어짐 표시(CV-02)', async () => {
    seedSn12();
    open('week');
    const [b] = await screen.findAllByRole('button', { name: /^B, / });
    expect(bars('B')).toHaveLength(1);
    expect(slotColumn(b)).toBe('6 / span 2');
    expect(b).toHaveClass('contRight');
    expect(b).toHaveTextContent('>');
    expect(b).toHaveTextContent('· 시작 전 (11-06~11-10)');
  });

  it('겹치지 않는 할일(CV-03)은 응답에 섞여 와도 표시하지 않는다', async () => {
    const cv03 = makeTodo({ title: 'CV03', startDate: '2026-10-25', endDate: '2026-10-31' });
    const inRange = makeTodo({ title: 'IN', startDate: '2026-11-02', endDate: '2026-11-02' });
    server.use(
      http.get(`${API}/todos/calendar`, () =>
        HttpResponse.json({
          items: [cv03, inRange].map((t) => ({ ...t, status: statusOf(t, TODAY) })),
        }),
      ),
    );
    open('week');
    await screen.findAllByRole('button', { name: /^IN, / });
    expect(screen.queryByRole('button', { name: /^CV03, / })).not.toBeInTheDocument();
  });

  it('월 → 주 전환 시 기준일 포함 주, 기준일 11-30이면 11-29~12-05(WA-17)', async () => {
    const { user } = open('month', '2026-11-30');
    await screen.findByText('이 기간에 할일이 없습니다.');
    await user.click(screen.getByRole('radio', { name: '주' }));
    expect(title()).toHaveTextContent('2026.11.29 ~ 12.05');
    await vi.waitFor(() =>
      expect(lastCalendarQuery()).toMatchObject({ from: '2026-11-29', to: '2026-12-05' }),
    );
    expect(dayCell('2026-12-05')).toHaveTextContent('토 12/05');
  });

  it('막대 클릭 → 편집, 날짜 칸·[+N건] → 일 뷰(월 뷰와 같음)', async () => {
    const { B } = seedSn12();
    for (let i = 1; i <= 4; i++)
      makeTodo({ title: `X${i}`, startDate: '2026-11-05', endDate: '2026-11-05' });
    const { user, router } = open('week');

    await user.click(await screen.findByRole('button', { name: '+1건' })); // 11-05의 X1~X4 중 한도 3을 넘은 1건
    expect(title()).toHaveTextContent('2026.11.05 (목)');

    await user.click(screen.getByRole('radio', { name: '주' }));
    await user.click(dayCell('2026-11-02'));
    expect(title()).toHaveTextContent('2026.11.02 (월)');

    await user.click(screen.getByRole('radio', { name: '주' }));
    await user.click((await screen.findAllByRole('button', { name: /^B, / }))[0]);
    expect(router.state.location.pathname).toBe(`/todos/${B.id}/edit`);
  });

  it('범위 내 할일이 없으면 빈 문구(5.6)', async () => {
    open('week');
    expect(await screen.findByText('이 기간에 할일이 없습니다.')).toBeInTheDocument();
    expect(dayCell('2026-11-07')).toBeInTheDocument();
  });
});
