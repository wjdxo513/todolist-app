import { useNavigate } from 'react-router';
import type { TodoWithStatus } from '../../../api/types';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { StatusBadge, StatusBar } from '../../../components/ui/StatusBadge';
import {
  addDays,
  diffDays,
  formatShort,
  todayLocal,
  WEEKDAYS,
  type DateRange,
} from '../../../lib/date';
import { CALENDAR_BAR_LIMIT } from '../../../lib/limits';
import { MESSAGES } from '../../../lib/messages';
import { ROUTES } from '../../../lib/routes';
import { useCalendarStore, type CalendarView } from '../../../stores/calendarStore';
import { useCategories } from '../../categories';
import { gridWeeks, layoutWeek, viewRange, viewTitle } from '../calendar';
import { useCalendarTodos, useIsMobile } from '../hooks';
import styles from './Calendar.module.css';

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: 'month', label: '월' },
  { value: 'week', label: '주' },
  { value: 'day', label: '일' },
];

function Toolbar({ title }: { title: string }) {
  const { view, setView, move, goToday } = useCalendarStore();
  const unit = { month: '달', week: '주', day: '날' }[view];
  return (
    <div className={styles.toolbar}>
      <div className={styles.nav}>
        <Button size="sm" onClick={() => move(-1)} aria-label={`이전 ${unit}`}>
          &lt;
        </Button>
        <Button size="sm" onClick={goToday}>
          오늘
        </Button>
        <Button size="sm" onClick={() => move(1)} aria-label={`다음 ${unit}`}>
          &gt;
        </Button>
      </div>
      <h2 className={styles.rangeTitle} aria-live="polite">
        {title}
      </h2>
      <div role="radiogroup" aria-label="보기" className={styles.segment}>
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            role="radio"
            aria-checked={view === v.value}
            className={styles.segmentItem}
            onClick={() => setView(v.value)}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface GridProps {
  items: TodoWithStatus[];
  range: DateRange;
  today: string;
  view: 'month' | 'week';
}

/** 월·주 뷰 그리드(FE-15, FE-16). 날짜 칸·[+N건] → 일 뷰, 막대 → 편집(모바일은 일 뷰), WA-16·18 */
function Grid({ items, range, today, view }: GridProps) {
  const navigate = useNavigate();
  const openDay = useCalendarStore((s) => s.openDay);
  const isMobile = useIsMobile();
  const weeks = gridWeeks(range);
  return (
    <div className={styles.grid} data-view={view}>
      {view === 'month' && (
        <div className={styles.weekdays}>
          {WEEKDAYS.map((w, i) => (
            <span key={w} className={i === 0 ? styles.sunday : undefined}>
              {w}
            </span>
          ))}
        </div>
      )}
      {weeks.map((weekStart) => {
        const { bars, hidden } = layoutWeek(items, weekStart, range, CALENDAR_BAR_LIMIT);
        return (
          <div key={weekStart} className={styles.week}>
            {Array.from({ length: 7 }, (_, col) => {
              const date = addDays(weekStart, col);
              const isOutside = date < range.from || date > range.to;
              const isToday = date === today;
              const d = Number(date.slice(8));
              const label =
                view === 'week' ? `${WEEKDAYS[col]} ${date.slice(5).replace('-', '/')}` : String(d); // 주 뷰 '일 11/01'(4번 문서 4.7)
              return (
                <button
                  key={date}
                  type="button"
                  className={styles.day}
                  style={{ gridColumn: col + 1 }}
                  data-today={isToday || undefined}
                  data-outside={isOutside || undefined}
                  data-sunday={col === 0 || undefined}
                  onClick={() => openDay(date)}
                  aria-label={`${date} 일 보기`}
                >
                  <span className={styles.dayNumber}>{label}</span>
                  {isToday && <span className={styles.todayMark}>(오늘)</span>}
                </button>
              );
            })}
            {bars.map((b) => (
              <div
                key={b.item.id}
                className={styles.barSlot}
                style={{ gridColumn: `${b.col + 1} / span ${b.span}`, gridRow: b.lane + 2 }}
              >
                <StatusBar
                  status={b.item.status}
                  title={isMobile ? undefined : b.item.title}
                  detail={
                    !isMobile && view === 'week'
                      ? `· ${b.item.status} (${formatShort(b.item.startDate, today)}~${formatShort(b.item.endDate, today)})`
                      : undefined
                  }
                  continuesLeft={b.continuesLeft}
                  continuesRight={b.continuesRight}
                  ariaLabel={`${b.item.title}, ${b.item.status}, ${b.item.startDate}~${b.item.endDate}`}
                  onClick={() =>
                    isMobile ? openDay(b.start) : navigate(ROUTES.todoEdit(b.item.id))
                  }
                />
              </div>
            ))}
            {Object.entries(hidden).map(([date, n]) => (
              <button
                key={`more-${date}`}
                type="button"
                className={styles.more}
                style={{
                  gridColumn: diffDays(weekStart, date) + 1,
                  gridRow: CALENDAR_BAR_LIMIT + 2,
                }}
                onClick={() => openDay(date)}
              >
                +{n}건
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** 일 뷰(FE-14): 그 날짜가 기간에 포함된 할일 목록 */
function DayList({ items, today }: { items: TodoWithStatus[]; today: string }) {
  const navigate = useNavigate();
  const categories = useCategories();
  const names = new Map(categories.data?.map((c) => [c.id, c.name]));
  if (items.length === 0) return <EmptyState message="이 날짜에 할일이 없습니다." />;
  return (
    <ul className={styles.dayList} aria-label="이 날짜의 할일">
      {items.map((t) => (
        <li key={t.id} className={styles.dayItem}>
          <StatusBadge status={t.status} />
          <button
            type="button"
            className={styles.dayTitle}
            data-done={t.status === '완료' || undefined}
            onClick={() => navigate(ROUTES.todoEdit(t.id))}
          >
            {t.title}
          </button>
          <span className={styles.muted}>{names.get(t.categoryId)}</span>
          <span className={styles.muted}>
            {formatShort(t.startDate, today)} ~ {formatShort(t.endDate, today)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** SC-07 캘린더(SN-12) */
export function Calendar() {
  const { view, baseDate } = useCalendarStore();
  const today = todayLocal();
  const range = viewRange(view, baseDate);
  const todos = useCalendarTodos({ ...range, today });
  const items = todos.data ?? [];
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>캘린더</h1>
      <ErrorBanner message={todos.isError ? MESSAGES.generic : null} />
      <div className={styles.card}>
        <Toolbar title={viewTitle(view, baseDate)} />
        {todos.isPending ? (
          <p role="status">불러오는 중…</p>
        ) : view === 'day' ? (
          <DayList items={items} today={today} />
        ) : (
          <>
            <Grid items={items} range={range} today={today} view={view} />
            {items.length === 0 && !todos.isError && (
              <EmptyState message="이 기간에 할일이 없습니다." />
            )}
          </>
        )}
      </div>
    </div>
  );
}
