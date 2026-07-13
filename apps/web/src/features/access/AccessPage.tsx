import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState, PageLoading } from '../../components/States';
import { friendlyError } from '../../lib/api';
import { exchangeAccessKey } from './api';

export function AccessPage() {
  const { slug, mode } = useParams();
  const [params] = useSearchParams();
  const key = params.get('k');
  const navigate = useNavigate();
  const client = useQueryClient();
  const started = useRef(false);
  const [mismatch, setMismatch] = useState(false);
  const mutation = useMutation({
    mutationFn: exchangeAccessKey,
    onSuccess: async (session) => {
      if (
        session.workspace.slug !== slug ||
        (mode === 'manage' && session.role !== 'owner') ||
        (mode === 'join' && session.role !== 'participant')
      ) {
        setMismatch(true);
        return;
      }
      client.setQueryData(['session'], session);
      window.history.replaceState({}, '', `/w/${slug}/${mode}`);
      navigate('/today', { replace: true });
    },
  });
  useEffect(() => {
    if (!started.current && key) {
      started.current = true;
      mutation.mutate(key);
    }
  }, [key, mutation]);
  if (!key) return <ErrorState message="链接中缺少访问密钥，请检查链接是否完整。" />;
  if (mutation.isError)
    return (
      <ErrorState message={friendlyError(mutation.error)} retry={() => mutation.mutate(key)} />
    );
  if (mismatch) return <ErrorState message="访问链接与工作空间或角色不匹配。" />;
  return <PageLoading />;
}
