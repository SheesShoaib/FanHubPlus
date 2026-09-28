import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Sparkles,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";
import { motion } from "framer-motion";

import api from "../../services/api";
import "../../styles/pages/login.css";
import "../../styles/pages/reset-password.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name] || errors.server) {
      setErrors((current) => ({ ...current, [name]: "", server: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: formData.password });
      setDone(true);
    } catch (err) {
      setErrors((current) => ({ ...current, server: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="login-page">
      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 35, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="login-image-side">
          <motion.div
            className="login-image"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="login-image-overlay" />
          <motion.div
            className="login-image-content"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            <div className="login-brand-icon">
              <Sparkles size={18} />
            </div>
            <span className="login-small-title">FANHUB+</span>
            <h2>Almost there.<br />New password time.</h2>
            <p>Choose something strong you'll actually remember.</p>
            <div className="login-image-line">
              <span />
              <p>ONE HUB. EVERY FANDOM.</p>
            </div>
          </motion.div>
          <div className="login-orb login-orb-one" />
          <div className="login-orb login-orb-two" />
        </div>

        <motion.div
          className="login-form-side"
          initial={{ opacity: 0, x: 35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="login-form-wrap">
            <div className="login-mobile-brand">
              <Sparkles size={17} />
              <span>FANHUB<b>+</b></span>
            </div>

            {done ? (
              <div className="forgot-success">
                <CheckCircle2 size={44} />
                <h2>Password updated</h2>
                <p>Your password has been reset. You can sign in now.</p>
                <Link to="/login" className="login-submit forgot-back-btn">
                  <span>Go to sign in</span>
                </Link>
              </div>
            ) : !token ? (
              <div className="forgot-success">
                <TriangleAlert size={44} />
                <h2>No reset token found</h2>
                <p>Use the forgot password page to receive a 6-digit OTP on your email, then set your new password.</p>
                <Link to="/forgot-password" className="login-submit forgot-back-btn">
                  <span>Reset via OTP</span>
                </Link>
              </div>
            ) : (
              <>
                <div className="login-heading">
                  <span className="login-kicker">ACCOUNT RECOVERY</span>
                  <h1>Set a new <span>password.</span></h1>
                  <p>Choose a new password for your account.</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                  <div className="login-field">
                    <label htmlFor="password">New password</label>
                    <div className={`login-input ${errors.password ? "input-error" : ""}`}>
                      <LockKeyhole size={17} />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="login-eye"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errors.password && <motion.p className="login-error">{errors.password}</motion.p>}
                  </div>

                  <div className="login-field">
                    <label htmlFor="confirmPassword">Confirm password</label>
                    <div className={`login-input ${errors.confirmPassword ? "input-error" : ""}`}>
                      <LockKeyhole size={17} />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                      />
                    </div>
                    {errors.confirmPassword && <motion.p className="login-error">{errors.confirmPassword}</motion.p>}
                  </div>

                  {errors.server && (
                    <motion.p className="login-error" style={{ marginBottom: "12px" }}>
                      {errors.server}{" "}
                      <Link to="/forgot-password">Request a new code</Link>
                    </motion.p>
                  )}

                  <motion.button
                    type="submit"
                    className="login-submit"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting}
                  >
                    <span>{submitting ? "Updating..." : "Update password"}</span>
                    <span className="login-arrow">
                      <ArrowRight size={16} />
                    </span>
                  </motion.button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default ResetPassword;
