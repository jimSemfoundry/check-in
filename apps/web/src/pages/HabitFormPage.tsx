import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createHabitRequestSchema, type CreateHabitRequest } from '@soft-habit/contracts';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../features/access/SessionProvider';
import { getHabit, saveHabit } from '../features/habits/api';
import { localDate } from '../lib/config';

export function HabitFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { session } = useSession();
  const existing = useQuery({
    queryKey: ['habit', id],
    queryFn: () => getHabit(id!),
    enabled: Boolean(id),
  });
  const form = useForm<CreateHabitRequest>({
    resolver: zodResolver(createHabitRequestSchema),
    defaultValues: {
      name: '',
      icon: 'spa',
      targetCount: 1,
      targetUnit: '次',
      frequencyType: 'daily',
      startDate: localDate(),
      sortOrder: 0,
      schedules: [],
      reminder: { enabled: false, localTime: null },
    },
  });
  useEffect(() => {
    if (existing.data) form.reset(existing.data);
  }, [existing.data, form]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (form.formState.isDirty) event.preventDefault();
    };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [form.formState.isDirty]);
  const frequency = useWatch({ control: form.control, name: 'frequencyType' });
  const reminder = useWatch({ control: form.control, name: 'reminder.enabled' });
  const mutation = useMutation({
    mutationFn: (data: CreateHabitRequest) => saveHabit(data, id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['habits'] });
      navigate('/habits');
    },
  });
  if (session?.role !== 'owner') return <Navigate to="/today" replace />;
  return (
    <section className="page">
      <h1>{id ? '编辑习惯' : '新建习惯'}</h1>
      <form className="habit-form" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        <label>
          名称
          <input {...form.register('name')} />
          {form.formState.errors.name && <small>{form.formState.errors.name.message}</small>}
        </label>
        <label>
          图标
          <input {...form.register('icon')} />
        </label>
        <div className="form-row">
          <label>
            目标数量
            <input type="number" {...form.register('targetCount', { valueAsNumber: true })} />
          </label>
          <label>
            单位
            <input {...form.register('targetUnit')} />
          </label>
        </div>
        <label>
          重复
          <select
            {...form.register('frequencyType', {
              onChange: (e) => {
                const type = e.target.value;
                form.setValue(
                  'schedules',
                  type === 'weekly'
                    ? [{ timesPerWeek: 3 }]
                    : type === 'monthly'
                      ? [{ monthDay: 1 }]
                      : [],
                );
              },
            })}
          >
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
        </label>
        {frequency === 'weekly' && (
          <label>
            每周次数
            <input
              type="number"
              min="1"
              max="7"
              {...form.register('schedules.0.timesPerWeek', { valueAsNumber: true })}
            />
          </label>
        )}
        {frequency === 'monthly' && (
          <label>
            每月日期
            <input
              type="number"
              min="1"
              max="31"
              {...form.register('schedules.0.monthDay', { valueAsNumber: true })}
            />
          </label>
        )}
        <label>
          开始日期
          <input type="date" {...form.register('startDate')} />
        </label>
        <label className="toggle-label">
          <input type="checkbox" {...form.register('reminder.enabled')} />
          开启提醒
        </label>
        {reminder && (
          <label>
            提醒时间
            <input
              type="time"
              {...form.register('reminder.localTime', { setValueAs: (v) => v || null })}
            />
          </label>
        )}
        {form.formState.errors.schedules && (
          <small>{form.formState.errors.schedules.message}</small>
        )}
        <div className="form-actions">
          <button
            type="button"
            onClick={() =>
              (!form.formState.isDirty || confirm('有未保存的修改，确定离开？')) && navigate(-1)
            }
          >
            取消
          </button>
          <button className="primary-button" disabled={mutation.isPending}>
            {mutation.isPending ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </section>
  );
}
