import { useRouteError } from "react-router-dom";

export default function Error() {
  const error = useRouteError();

  return (
    <div className="text-white text-center py-20">
      <h1 className="text-4xl font-bold text-red-400">404</h1>
      <p className="mt-4 text-cyan-500/70">
        Something went wrong or page not found.
      </p>
      <pre className="mt-4 text-sm text-gray-400">
        {error?.statusText || error?.message}
      </pre>
    </div>
  );
}