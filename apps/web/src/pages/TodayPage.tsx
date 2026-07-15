import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, PageLoading } from '../components/States';
import { RoleGate } from '../components/RoleGate';
import { archiveHabit } from '../features/habits/api';
import { getToday } from '../features/today/api';
import { setCheckin } from '../features/checkins/api';
import { friendlyError } from '../lib/api';

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div
      className="progress-ring"
      style={{ '--progress': `${percent * 3.6}deg` } as React.CSSProperties}
    >
      <div>
        <strong>{percent}%</strong>
        <span>
          {completed}/{total} 完成
        </span>
      </div>
    </div>
  );
}
export function TodayPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['today'], queryFn: getToday, refetchInterval: 20_000 });
  const checkin = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) => setCheckin(id, checked),
    onMutate: async ({ id, checked }) => {
      await client.cancelQueries({ queryKey: ['today'] });
      const previous = client.getQueryData(['today']);
      client.setQueryData(
        ['today'],
        (old: typeof query.data) =>
          old && {
            ...old,
            completedCount: old.completedCount + (checked ? 1 : -1),
            habits: old.habits.map((item) =>
              item.habit.id === id
                ? {
                    ...item,
                    checkin: checked
                      ? {
                          id: crypto.randomUUID(),
                          habitId: id,
                          checkinDate: old.date,
                          completedAt: new Date().toISOString(),
                          cancelledAt: null,
                        }
                      : null,
                  }
                : item,
            ),
          },
      );
      return { previous };
    },
    onError: (_error, _variables, context) => client.setQueryData(['today'], context?.previous),
    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['today'] }),
        client.invalidateQueries({ queryKey: ['history'] }),
        client.invalidateQueries({ queryKey: ['pet'] }),
      ]);
    },
  });
  const archive = useMutation({
    mutationFn: archiveHabit,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['today'] }),
        client.invalidateQueries({ queryKey: ['habits'] }),
        client.invalidateQueries({ queryKey: ['history'] }),
        client.invalidateQueries({ queryKey: ['pet'] }),
      ]);
    },
  });
  const confirmArchive = (id: string, name: string) => {
    if (!confirm(`删除“${name}”？删除后今日列表不再显示，历史记录会保留。`)) return;
    archive.mutate(id);
  };
  if (query.isLoading) return <PageLoading />;
  if (query.isError)
    return <ErrorState message={friendlyError(query.error)} retry={() => void query.refetch()} />;
  const today = query.data!;
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">今天也温柔地坚持</span>
          <h1>我的习惯</h1>
        </div>
        <RoleGate>
          <Link to="/habits/new" className="icon-button raised" aria-label="添加习惯">
            <span className="material-symbols-rounded">add</span>
          </Link>
        </RoleGate>
      </div>
      <div className="summary-card">
        <ProgressRing completed={today.completedCount} total={today.plannedCount} />
        <div>
          <h2>
            {today.completedCount === today.plannedCount && today.plannedCount
              ? '今天全部完成啦！'
              : '慢慢来，也是在前进'}
          </h2>
          <p>每一次小小的完成，都在为糯米积攒快乐。</p>
          <span className="food">
            <span className="material-symbols-rounded">nutrition</span>
            {today.pet.foodBalance} 份食物
          </span>
        </div>
      </div>
      {today.habits.length ? (
        <div className="habit-list">
          {today.habits.map(({ habit, checkin: done }) => (
            <article className={`habit-card ${done ? 'completed' : ''}`} key={habit.id}>
              <span className="habit-icon material-symbols-rounded">{habit.icon}</span>
              <div className="habit-copy">
                <h2>{habit.name}</h2>
                <p>
                  目标 {habit.targetCount}
                  {habit.targetUnit ?? '次'}
                </p>
              </div>
              <RoleGate>
                <Link
                  className="edit-button"
                  aria-label={`编辑${habit.name}`}
                  to={`/habits/${habit.id}/edit`}
                >
                  <span className="material-symbols-rounded">edit</span>
                </Link>
                <button
                  className="edit-button danger"
                  aria-label={`删除${habit.name}`}
                  disabled={archive.isPending}
                  onClick={() => confirmArchive(habit.id, habit.name)}
                >
                  <span className="material-symbols-rounded">delete</span>
                </button>
              </RoleGate>
              <button
                className="check-button"
                disabled={checkin.isPending || !navigator.onLine}
                onClick={() => checkin.mutate({ id: habit.id, checked: !done })}
                aria-label={`${done ? '撤销' : '完成'}${habit.name}`}
                aria-pressed={Boolean(done)}
              >
                <span className="material-symbols-rounded">{done ? 'check' : ''}</span>
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
