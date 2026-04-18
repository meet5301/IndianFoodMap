import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", otp: "" });
  const [message, setMessage] = useState("");
  const fromStatePath = location.state?.from?.pathname || "";
  const intent = searchParams.get("intent") || "";
  const nextFromQuery = searchParams.get("next") || "";
  const isOwnerIntent = intent === "add-stall" || fromStatePath.startsWith("/add-vendor");
  const [entryMode, setEntryMode] = useState(isOwnerIntent ? "owner" : "browse");

  const from =
    nextFromQuery ||
    fromStatePath ||
    (entryMode === "owner" || isOwnerIntent ? "/add-vendor" : entryMode === "customer" ? "/profile" : "/find-stall");

  const setAccessMode = (nextMode) => {
    localStorage.setItem("ifm_access_mode", nextMode);
  };

  if (isOwnerIntent && localStorage.getItem("ifm_access_mode") !== "vendor") {
    localStorage.setItem("ifm_access_mode", "vendor");
  }

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
      }
      navigate(from, { replace: true });
    } catch (error) {
      setMessage(error.message);
    }
  };

  const onRequestOtp = async () => {
    try {
      const result = await api.requestOtp({ phone: form.phone });
      setMessage(`Mock OTP sent: ${result.otp}`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const onVerifyOtp = async () => {
    try {
      const result = await api.verifyOtp({ phone: form.phone, otp: form.otp });
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main className="page-wrap pb-8">
      <Helmet>
        <title>Auth - IndiaFoodMap</title>
      </Helmet>

      <section className="mx-auto max-w-xl glass-card p-5">
        <h1 className="font-display text-3xl font-bold">Choose your mode</h1>
        <p className="mt-2 text-sm text-slate-300">
          Browsing stalls does not require login. Adding your own stall requires login or registration.
        </p>

        {entryMode === "browse" ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <article className="rounded-xl border border-line bg-panelSoft p-4">
              <p className="inline-block rounded-full bg-emerald-300/20 px-2 py-1 text-xs font-semibold text-emerald-200">No Login Needed</p>
              <h2 className="mt-2 font-display text-xl font-bold text-white">I only want to explore stalls</h2>
              <p className="mt-2 text-sm text-slate-300">Explore nearby vendors, maps, and vendor pages without creating an account.</p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  to="/find-stall"
                  className="btn-primary text-center"
                  onClick={() => setAccessMode("customer")}
                >
                  Find stalls now
                </Link>
                <Link to="/home" className="btn-ghost text-center">Open home view</Link>
              </div>
            </article>

            <article className="rounded-xl border border-line bg-panelSoft p-4">
              <p className="inline-block rounded-full bg-sky-300/20 px-2 py-1 text-xs font-semibold text-sky-200">Customer Login</p>
              <h2 className="mt-2 font-display text-xl font-bold text-white">I want my profile and saved activity</h2>
              <p className="mt-2 text-sm text-slate-300">Login or register to view your profile, search history, and customer shortcuts.</p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={() => {
                    setAccessMode("customer");
                    setEntryMode("customer");
                  }}
                >
                  Continue to customer login
                </button>
                <Link to="/profile" className="btn-ghost text-center">
                  View profile after login
                </Link>
              </div>
            </article>

            <article className="rounded-xl border border-line bg-panelSoft p-4">
              <p className="inline-block rounded-full bg-amber-300/20 px-2 py-1 text-xs font-semibold text-amber-200">Owner Access</p>
              <h2 className="mt-2 font-display text-xl font-bold text-white">I want to add my stall</h2>
              <p className="mt-2 text-sm text-slate-300">Login or register to submit your stall details.</p>
              <button
                type="button"
                className="btn-primary mt-3 w-full"
                onClick={() => {
                  setAccessMode("vendor");
                  setEntryMode("owner");
                }}
              >
                Continue to owner login
              </button>
            </article>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button type="button" className={`${mode === "login" ? "btn-primary" : "btn-ghost"} w-full sm:w-auto`} onClick={() => setMode("login")}>
                Login
              </button>
              <button type="button" className={`${mode === "register" ? "btn-primary" : "btn-ghost"} w-full sm:w-auto`} onClick={() => setMode("register")}>
                Register
              </button>
              <button
                type="button"
                className="btn-ghost w-full sm:w-auto"
                onClick={() => {
                  setAccessMode("customer");
                  setEntryMode("browse");
                }}
              >
                Back to browsing options
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-2">
              {mode === "register" ? (
                <input className="input-ui" name="name" value={form.name} onChange={onChange} placeholder="Full name" required />
              ) : null}
              <input className="input-ui" type="email" name="email" value={form.email} onChange={onChange} placeholder="Email" required />
              <input className="input-ui" type="password" name="password" value={form.password} onChange={onChange} placeholder="Password" required />
              <button className="btn-primary w-full" disabled={loading} type="submit">
                {loading ? "Please wait..." : mode === "login" ? "Login and continue" : "Register and continue"}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-line bg-panelSoft p-3">
              <p className="text-sm font-semibold text-slate-200">Mock OTP Verification</p>
              <div className="mt-2 space-y-2">
                <input className="input-ui" name="phone" value={form.phone} onChange={onChange} placeholder="Phone number" />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" className="btn-ghost w-full sm:w-auto" onClick={onRequestOtp}>
                    Request OTP
                  </button>
                  <input className="input-ui" name="otp" value={form.otp} onChange={onChange} placeholder="Enter OTP" />
                  <button type="button" className="btn-ghost w-full sm:w-auto" onClick={onVerifyOtp}>
                    Verify
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {message ? <p className="mt-3 text-sm text-amber-200">{message}</p> : null}
      </section>
    </main>
  );
};

export default AuthPage;
