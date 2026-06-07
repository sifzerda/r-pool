// src/pages/Login.jsx

export default function Login() {
  return (

    <section className="flex items-center justify-center py-8 px-6">
      <div className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-cyan-400/15 bg-black/40 p-10 backdrop-blur-2xl shadow-[0_0_60px_rgba(34,211,238,0.08)]">

        <h2 className="mb-6 text-center text-4xl italic text-cyan-100"
          style={{
            fontFamily: "cursive",
            textShadow:
              "0 0 8px rgba(103,232,249,0.8), 0 0 20px rgba(34,211,238,0.8)",
          }}>
          Login
        </h2>

        <form className="flex flex-col gap-6">
          <input
            type="email"
            placeholder="Email"
            className="rounded-xl border border-cyan-400/30 bg-black/60 px-4 py-3 text-white placeholder:text-zinc-400" />

          <input
            type="password"
            placeholder="Password"
            className="rounded-xl border border-cyan-400/30 bg-black/60 px-4 py-3 text-white placeholder:text-zinc-400" />

          <button
            type="submit"
            className="group relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-4 text-sm font-bold text-cyan-100 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.35)] hover:cursor-pointer">
            <span className="relative z-10">LOGIN</span>
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-cyan-300/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <a href="/login" className="text-cyan-400 underline hover:cursor-pointer">
            Login
          </a>
        </p>

      </div>
    </section>

  );
}
