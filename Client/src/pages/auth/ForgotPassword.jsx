import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  MailCheck,
  Mail,
  Sparkles,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import api from "../../services/api";
import "../../styles/pages/login.css";
import "../../styles/pages/forgot-password.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [devOTP, setDevOTP] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const otpRefs = useRef([]);

  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwErrors, setPwErrors] = useState({});
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    setEmailSubmitting(true);
    try {
      const data = await api.post("/auth/forgot-password", { email });
      if (data.devOTP) setDevOTP(data.devOTP);
      setStep(2);
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    if (otpError) setOtpError("");
    if (char && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((c) => !c);
    otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      setOtpError("Enter the full 6-character code");
      return;
    }
    setOtpError("");
    setOtpSubmitting(true);
    try {
      const data = await api.post("/auth/verify-reset-otp", { email, otp: otpValue });
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    const errs = {};
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (confirmPassword !== password) errs.confirmPassword = "Passwords don't match";
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPwSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token: resetToken, newPassword: password });
      setDone(true);
    } catch (err) {
      setPwErrors({ server: err.message });
    } finally {
      setPwSubmitting(false);
    }
  };

  const leftContent = [
    {
      heading: <>Forgot something?<br />We've got you.</>,
      body: "It happens to everyone. Enter your email and we'll send you a 6-character reset code.",
    },
    {
      heading: <>Check your<br />inbox.</>,
      body: `We've sent a 6-character code to ${email || "your email"}. Enter it below to continue.`,
    },
    {
      heading: <>Almost there.<br />New password time.</>,
      body: "Choose something strong you'll actually remember.",
    },
  ];

  const left = leftContent[step - 1];

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
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                <h2>{left.heading}</h2>
                <p>{left.body}</p>
              </motion.div>
            </AnimatePresence>
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

            {!done && (
              <div className="otp-steps">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`otp-step-dot ${step >= s ? "active" : ""}`} />
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">

              {done && (
                <motion.div
                  key="done"
                  className="forgot-success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <CheckCircle2 size={44} />
                  <h2>Password updated</h2>
                  <p>Your password has been reset successfully. You can sign in now.</p>
                  <Link to="/login" className="login-submit forgot-back-btn">
                    <span>Go to sign in</span>
                  </Link>
                </motion.div>
              )}

              {!done && step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="login-heading">
                    <span className="login-kicker">ACCOUNT RECOVERY</span>
                    <h1>Reset your <span>password.</span></h1>
                    <p>Enter the email linked to your account and we'll send you a 6-character reset code.</p>
                  </div>

                  <form className="login-form" onSubmit={handleEmailSubmit} noValidate>
                    <div className="login-field">
                      <label htmlFor="email">Email address</label>
                      <div className={`login-input ${emailError ? "input-error" : ""}`}>
                        <Mail size={17} />
                        <input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                          autoComplete="email"
                        />
                      </div>
                      {emailError && (
                        <motion.p className="login-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                          {emailError}
                        </motion.p>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      className="login-submit"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={emailSubmitting}
                    >
                      <span>{emailSubmitting ? "Sending..." : "Send reset code"}</span>
                      <span className="login-arrow"><ArrowRight size={16} /></span>
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {!done && step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="login-heading">
                    <span className="login-kicker">ACCOUNT RECOVERY</span>
                    <h1>Enter the <span>code.</span></h1>
                    <p>
                      We sent a 6-character code to <b>{email}</b>. It expires in 10 minutes.
                    </p>
                  </div>

                  {devOTP && (
                    <p className="fh-dev-note">
                      No SMTP configured — dev OTP: <b style={{ letterSpacing: "4px" }}>{devOTP}</b>
                    </p>
                  )}

                  <form className="login-form" onSubmit={handleOtpSubmit} noValidate>
                    <div className="login-field">
                      <label>Verification code</label>
                      <div className="otp-boxes" onPaste={handleOtpPaste}>
                        {otp.map((char, i) => (
                          <input
                            key={i}
                            ref={(el) => (otpRefs.current[i] = el)}
                            className={`otp-box ${otpError ? "input-error" : ""}`}
                            type="text"
                            inputMode="text"
                            maxLength={1}
                            value={char}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            autoFocus={i === 0}
                            autoComplete="one-time-code"
                          />
                        ))}
                      </div>
                      {otpError && (
                        <motion.p className="login-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                          {otpError}
                        </motion.p>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      className="login-submit"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={otpSubmitting}
                    >
                      <span>{otpSubmitting ? "Verifying..." : "Verify code"}</span>
                      <span className="login-arrow"><ShieldCheck size={16} /></span>
                    </motion.button>
                  </form>

                  <button
                    type="button"
                    className="otp-resend-btn"
                    onClick={() => { setOtp(["","","","","",""]); setOtpError(""); setStep(1); }}
                  >
                    Use a different email
                  </button>
                </motion.div>
              )}

              {!done && step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="login-heading">
                    <span className="login-kicker">ACCOUNT RECOVERY</span>
                    <h1>Set a new <span>password.</span></h1>
                    <p>Choose a new password for your account.</p>
                  </div>

                  <form className="login-form" onSubmit={handlePasswordSubmit} noValidate>
                    <div className="login-field">
                      <label htmlFor="new-password">New password</label>
                      <div className={`login-input ${pwErrors.password ? "input-error" : ""}`}>
                        <LockKeyhole size={17} />
                        <input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); if (pwErrors.password) setPwErrors((p) => ({ ...p, password: "" })); }}
                          autoComplete="new-password"
                        />
                        <button type="button" className="login-eye" onClick={() => setShowPassword((v) => !v)}>
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                      {pwErrors.password && <motion.p className="login-error">{pwErrors.password}</motion.p>}
                    </div>

                    <div className="login-field">
                      <label htmlFor="confirm-password">Confirm password</label>
                      <div className={`login-input ${pwErrors.confirmPassword ? "input-error" : ""}`}>
                        <LockKeyhole size={17} />
                        <input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); if (pwErrors.confirmPassword) setPwErrors((p) => ({ ...p, confirmPassword: "" })); }}
                          autoComplete="new-password"
                        />
                      </div>
                      {pwErrors.confirmPassword && <motion.p className="login-error">{pwErrors.confirmPassword}</motion.p>}
                    </div>

                    {pwErrors.server && (
                      <motion.p className="login-error" style={{ marginBottom: "12px" }}>
                        {pwErrors.server}
                      </motion.p>
                    )}

                    <motion.button
                      type="submit"
                      className="login-submit"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={pwSubmitting}
                    >
                      <span>{pwSubmitting ? "Updating..." : "Update password"}</span>
                      <span className="login-arrow"><ArrowRight size={16} /></span>
                    </motion.button>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>

            <p className="login-register">
              Remembered it after all?{" "}
              <Link to="/login">Back to sign in</Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default ForgotPassword;
