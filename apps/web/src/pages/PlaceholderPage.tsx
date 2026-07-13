export function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  return (
    <section className="page placeholder">
      <span className="material-symbols-rounded">{icon}</span>
      <h1>{title}</h1>
      <p>这里正在长出新的内容。</p>
    </section>
  );
}
