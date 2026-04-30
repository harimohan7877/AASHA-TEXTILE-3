import { Link } from 'react-router-dom';

export default function NotFoundPublic() {
  return (
    <div className="min-h-screen bg-cream-50 grid place-items-center px-6">
      <div className="text-center">
        <div className="font-display text-7xl sm:text-9xl font-semibold text-stone-900">404</div>
        <div className="mt-2 text-stone-600">The page you're looking for doesn't exist.</div>
        <Link to="/" className="mt-6 inline-flex pub-btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}
