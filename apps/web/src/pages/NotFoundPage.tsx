import { Link } from 'react-router-dom';
export function NotFoundPage() {
  return (
    <section className="welcome">
      <span className="material-symbols-rounded">explore_off</span>
      <h1>页面走丢了</h1>
      <Link className="primary-button" to="/today">
        回到今日
      </Link>
    </section>
  );
}
