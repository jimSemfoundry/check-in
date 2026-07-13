import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    addEventListener('online', update);
    addEventListener('offline', update);
    return () => {
      removeEventListener('online', update);
      removeEventListener('offline', update);
    };
  }, []);
  return online ? null : (
    <div className="offline-banner" role="status">
      <span className="material-symbols-rounded">cloud_off</span>
      当前离线，可查看最近数据，写操作已暂停
    </div>
  );
}
