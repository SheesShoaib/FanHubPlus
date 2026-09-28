import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "../../styles/pages/login.css";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isAdmin } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
    }

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        remember: false,
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        if (errors[name] || errors.server) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
                server: "",
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            newErrors.email = "Enter a valid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password =
                "Password must be at least 6 characters";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);

        try {
            const data = await api.post("/auth/login", {
                email: formData.email,
                password: formData.password,
            });

            login(data.user, data.token);

            const from = location.state?.from;
            const fromPath = from ? `${from.pathname || ""}${from.search || ""}` : "";
            if (data.user.role === "admin") {
                navigate(fromPath.startsWith("/admin") ? fromPath : "/admin");
            } else {
                navigate(fromPath && !fromPath.startsWith("/admin") ? fromPath : "/dashboard");
            }
        } catch (err) {
            setErrors((prev) => ({ ...prev, server: err.message }));
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
                transition={{
                    duration: 0.75,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <div className="login-image-side">
                    <motion.div
                        className="login-image"
                        initial={{ scale: 1.08 }}
                        animate={{ scale: 1 }}
                        transition={{
                            duration: 1.5,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    />

                    <div className="login-image-overlay" />

                    <motion.div
                        className="login-image-content"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            duration: 0.7,
                            delay: 0.35,
                        }}
                    >
                        <div className="login-brand-icon">
                            <Sparkles size={18} />
                        </div>

                        <span className="login-small-title">
                            FANHUB+
                        </span>

                        <h2>
                            Your world.
                            <br />
                            Your fandom.
                        </h2>

                        <p>
                            Discover characters, stories and communities
                            built around everything you love.
                        </p>

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
                    transition={{
                        duration: 0.7,
                        delay: 0.2,
                    }}
                >
                    <div className="login-form-wrap">
                        <div className="login-mobile-brand">
                            <Sparkles size={17} />
                            <span>
                                FANHUB<b>+</b>
                            </span>
                        </div>

                        <div className="login-heading">
                            <span className="login-kicker">
                                MEMBER ACCESS
                            </span>

                            <h1>
                                Welcome <span>back.</span>
                            </h1>

                            <p>
                                Sign in and continue exploring your fandom
                                universe.
                            </p>
                        </div>

                        <form
                            className="login-form"
                            onSubmit={handleSubmit}
                            noValidate
                        >
                            <div className="login-field">
                                <label htmlFor="email">
                                    Email address
                                </label>

                                <div
                                    className={`login-input ${errors.email ? "input-error" : ""
                                        }`}
                                >
                                    <Mail size={17} />

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                    />
                                </div>

                                {errors.email && (
                                    <motion.p
                                        className="login-error"
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {errors.email}
                                    </motion.p>
                                )}
                            </div>

                            <div className="login-field">
                                <div className="login-label-row">
                                    <label htmlFor="password">
                                        Password
                                    </label>

                                    <Link to="/forgot-password">
                                        Forgot password?
                                    </Link>
                                </div>

                                <div
                                    className={`login-input ${errors.password ? "input-error" : ""
                                        }`}
                                >
                                    <LockKeyhole size={17} />

                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete="current-password"
                                    />

                                    <button
                                        type="button"
                                        className="login-eye"
                                        onClick={() =>
                                            setShowPassword((prev) => !prev)
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff size={17} />
                                        ) : (
                                            <Eye size={17} />
                                        )}
                                    </button>
                                </div>

                                {errors.password && (
                                    <motion.p
                                        className="login-error"
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {errors.password}
                                    </motion.p>
                                )}
                            </div>

                            <label className="login-remember">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={formData.remember}
                                    onChange={handleChange}
                                />

                                <span className="login-checkbox" />

                                <span>Remember me</span>
                            </label>

                            {errors.server && (
                                <motion.p
                                    className="login-error"
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ marginBottom: "12px" }}
                                >
                                    {errors.server}
                                </motion.p>
                            )}

                            <motion.button
                                type="submit"
                                className="login-submit"
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={submitting}
                            >
                                <span>{submitting ? "Signing in..." : "Sign in to FanHub"}</span>

                                <span className="login-arrow">
                                    <ArrowRight size={16} />
                                </span>
                            </motion.button>
                        </form>

                        <div className="login-divider">
                            <span />
                            <p>NEW TO THE HUB?</p>
                            <span />
                        </div>

                        <p className="login-register">
                            Create your own fandom profile.
                            <Link to="/register">
                                Join FanHub+
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}

export default Login;