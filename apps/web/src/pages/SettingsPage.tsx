import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../features/access/SessionProvider';
import { logout } from '../features/access/api';

export function SettingsPage() {
  const { session } = useSession();
  const client = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      client.clear();
      navigate('/welcome', { replace: true });
    },
  });
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">应用与会话</span>
          <h1>设置</h1>
        </div>
      </div>
      <div className="settings-card">
        <div>
          <span>工作空间</span>
          <strong>{session?.workspace.name}</strong>
        </div>
        <div>
          <span>当前身份</span>
          <strong>{session?.role === 'owner' ? '管理员' : '参与者'}</strong>
        </div>
        <div>
          <span>时区</span>
          <strong>{session?.workspace.timezone}</strong>
        </div>
      </div>
      <button
        className="logout-button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        <span className="material-symbols-rounded">logout</span>
        {mutation.isPending ? '正在退出…' : '退出当前会话'}
      </button>
    </section>
  );
}
