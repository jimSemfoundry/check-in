import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { EmptyState, PageLoading } from '../components/States';
import { useSession } from '../features/access/SessionProvider';
import { archiveHabit, getHabits } from '../features/habits/api';

export function HabitsPage() {
  const { session } = useSession();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['habits'], queryFn: getHabits });
  const archive = useMutation({
    mutationFn: archiveHabit,
    onSuccess: () => client.invalidateQueries({ queryKey: ['habits'] }),
  });
  if (session?.role !== 'owner') return <Navigate to="/today" replace />;
  if (query.isLoading) return <PageLoading />;
  const habits = query.data?.filter((h) => !h.archivedAt) ?? [];
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">建立舒服的节奏</span>
          <h1>习惯管理</h1>
        </div>
        <Link className="icon-button raised" aria-label="新建习惯" to="/habits/new">
          <span className="material-symbols-rounded">add</span>
        </Link>
      </div>
      {habits.length ? (
        <div className="habit-list">
          {habits.map((habit) => (
            <article className="habit-card" key={habit.id}>
              <span className="habit-icon material-symbols-rounded">{habit.icon}</span>
              <div className="habit-copy">
                <h2>{habit.name}</h2>
                <p>
                  {habit.frequencyType === 'daily'
                    ? '每天'
                    : habit.frequencyType === 'weekly'
                      ? '每周'
                      : '每月'}{' '}
                  · {habit.targetCount}
                  {habit.targetUnit}
                </p>
              </div>
              <Link
                className="edit-button"
                aria-label={`编辑${habit.name}`}
                to={`/habits/${habit.id}/edit`}
              >
                <span className="material-symbols-rounded">edit</span>
              </Link>
              <button
                className="edit-button"
                aria-label={`归档${habit.name}`}
                disabled={archive.isPending}
                onClick={() =>
                  confirm(`归档“${habit.name}”？历史记录会保留。`) && archive.mutate(habit.id)
                }
              >
                <span className="material-symbols-rounded">archive</span>
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
