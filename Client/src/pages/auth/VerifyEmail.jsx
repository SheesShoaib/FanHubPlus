import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, LoaderCircle, TriangleAlert } from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { isAuthenticated, updateUser } = useAuth();
  const [state, setState] = useState({ status: "loading", message: "" });
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    if (!token) {
      setState({ status: "error", message: "This verification link is missing its token." });
      return;
    }

    api
      .post("/auth/verify-email", { token })
      .then((data) => {
        setState({ status: "done", message: data.msg });
        if (isAuthenticated) updateUser({ isVerified: true });
      })
      .catch((err) => setState({ status: "error", message: err.message }));
  }, [token, isAuthenticated, updateUser]);

  return (
    <div className="site-container fh-page fh-center-card">
      {state.status === "loading" && (
        <>
          <LoaderCircle size={40} className="fh-spin" />
          <h1>Verifying your email...</h1>
        </>
      )}
      {state.status === "done" && (
        <>
          <CheckCircle2 size={44} className="fh-ok" />
          <h1>Email verified</h1>
          <p>{state.message}</p>
          <Link className="fh-btn" to={isAuthenticated ? "/dashboard" : "/login"}>
            {isAuthenticated ? "Go to dashboard" : "Log in"}
          </Link>
        </>
      )}
      {state.status === "error" && (
        <>
          <TriangleAlert size={44} className="fh-warn" />
          <h1>Couldn't verify</h1>
          <p>{state.message}</p>
          <p className="fh-muted">You can request a new link from your dashboard.</p>
          <Link className="fh-btn" to="/dashboard">
            Go to dashboard
          </Link>
        </>
      )}
    </div>
  );
}

export default VerifyEmail;
