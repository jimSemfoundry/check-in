import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getHistoryDay, getHistoryMonth } from '../features/history/api';
import { localDate } from '../lib/config';

export function HistoryPage() {
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [selected, setSelected] = useState(localDate());
  const monthly = useQuery({
    queryKey: ['history', 'month', month],
    queryFn: () => getHistoryMonth(month),
    placeholderData: (old) => old,
  });
  const daily = useQuery({
    queryKey: ['history', 'day', selected],
    queryFn: () => getHistoryDay(selected),
  });
  const move = (offset: number) => {
    const [y, m] = month.split('-').map(Number);
    const next = new Date(y!, m! - 1 + offset, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };
  const total = monthly.data?.days.reduce((sum, d) => sum + d.completedCount, 0) ?? 0;
  const planned = monthly.data?.days.reduce((sum, d) => sum + d.plannedCount, 0) ?? 0;
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">一步一步，都算数</span>
          <h1>历史记录</h1>
        </div>
      </div>
      <div className="calendar-card">
        <div className="month-switch">
          <button aria-label="上个月" onClick={() => move(-1)}>
            ‹
          </button>
          <strong>{month.replace('-', ' 年 ')} 月</strong>
          <button aria-label="下个月" onClick={() => move(1)}>
            ›
          </button>
        </div>
        <div className="weekdays">
          {'一二三四五六日'.split('').map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {monthly.data?.days.map((day) => (
            <button
              key={day.date}
              className={`${day.date === selected ? 'selected' : ''} ${day.date === localDate() ? 'today' : ''}`}
              onClick={() => setSelected(day.date)}
            >
              <span>{Number(day.date.slice(-2))}</span>
              <i
                style={
                  {
                    '--ratio': day.plannedCount ? day.completedCount / day.plannedCount : 0,
                  } as React.CSSProperties
                }
              />
            </button>
          ))}
        </div>
        <p className="month-total">
          本月完成 <strong>{total}</strong> / {planned}
        </p>
      </div>
      <div className="day-detail">
        <h2>
          {selected} · {daily.data?.completedCount ?? 0}/{daily.data?.plannedCount ?? 0}
        </h2>
        {daily.data?.habits.map((h) => (
          <div key={h.habitId}>
            <span className="material-symbols-rounded">{h.icon}</span>
            <span>{h.name}</span>
            <span className="material-symbols-rounded">
              {h.completed ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
