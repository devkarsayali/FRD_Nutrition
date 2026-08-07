import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 text-center">
      <div>
        <p className="text-8xl font-black text-lime-500">404</p>

        <h1 className="mt-4 text-3xl font-bold text-[#10130f]">
          Page not found
        </h1>

        <p className="mt-3 text-gray-600">
          The page you are looking for does not exist.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-[#10130f] px-6 py-3 font-semibold text-white transition hover:bg-lime-600"
        >
          Return Home
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;