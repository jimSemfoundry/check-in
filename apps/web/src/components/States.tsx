export function PageLoading() {
  return (
    <div className="state" role="status">
      <span className="spinner" />
      正在准备今天的习惯…
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="state">
      <span className="material-symbols-rounded state-icon">cloud_off</span>
      <h2>暂时无法加载</h2>
      <p>{message}</p>
      {retry && (
        <button className="primary-button" onClick={retry}>
          再试一次
        </button>
      )}
    </div>
  );
}
export function EmptyState() {
  return (
    <div className="empty">
      <span className="material-symbols-rounded">spa</span>
      <h2>今天还没有习惯</h2>
      <p>从一个轻松的小目标开始吧。</p>
    </div>
  );
}
