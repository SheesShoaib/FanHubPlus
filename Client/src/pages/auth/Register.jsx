import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    Sparkles,
    UserRound,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import api from "../../services/api";
import "../../styles/pages/register.css";

const FANDOM_CHOICES = [
    ["anime", "Anime"],
    ["gaming", "Gaming"],
    ["movies", "Movies"],
    ["tv-shows", "TV Shows"],
    ["kpop", "K-Pop"],
    ["comics", "Comics"],
    ["manga", "Manga"],
    ["cosplay", "Cosplay"],
];

function Register() {
    const navigate = useNavigate();
    const { login, isAuthenticated, isAdmin } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
    }
    const { settings } = useSettings();
    const [fandoms, setFandoms] = useState([]);

    const toggleFandom = (slug) =>
        setFandoms((current) =>
            current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
        );

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: false,
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
            server: "",
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Full name is required";
        } else if (formData.name.trim().length < 3) {
            newErrors.name = "Enter at least 3 characters";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email address is required";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            newErrors.email = "Enter a valid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Minimum 6 characters";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Confirm your password";
        } else if (
            formData.password !== formData.confirmPassword
        ) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (!formData.terms) {
            newErrors.terms = "Please accept the terms to continue";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);

        try {
            const data = await api.post("/auth/register", {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                favoriteFandoms: fandoms,
            });

            login(data.user, data.token);
            navigate(data.user.role === "admin" ? "/admin" : "/dashboard", {
                state: { devVerifyLink: data.devVerifyLink, justRegistered: true },
            });
        } catch (err) {
            setErrors((prev) => ({ ...prev, server: err.message }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="register-page">
            <motion.div
                className="register-container"
                initial={{
                    opacity: 0,
                    y: 30,
                    scale: 0.98,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                }}
                transition={{
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <motion.div
                    className="register-form-side"
                    initial={{ opacity: 0, x: -35 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                        duration: 0.7,
                        delay: 0.2,
                    }}
                >
                    <div className="register-form-wrap">
                        <div className="register-heading">
                            <span className="register-kicker">
                                JOIN THE HUB
                            </span>

                            <h1>
                                Create your <span>account.</span>
                            </h1>

                            <p>
                                Join the community and make every fandom
                                feel a little more like home.
                            </p>
                        </div>

                        <form
                            className="register-form"
                            onSubmit={handleSubmit}
                            noValidate
                        >
                            <div className="register-field">
                                <label htmlFor="name">Full name</label>

                                <div
                                    className={`register-input ${errors.name ? "register-input-error" : ""
                                        }`}
                                >
                                    <UserRound size={16} />

                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        autoComplete="name"
                                    />
                                </div>

                                {errors.name && (
                                    <motion.p
                                        className="register-error"
                                        initial={{ opacity: 0, y: -3 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {errors.name}
                                    </motion.p>
                                )}
                            </div>

                            <div className="register-field">
                                <label htmlFor="email">Email address</label>

                                <div
                                    className={`register-input ${errors.email ? "register-input-error" : ""
                                        }`}
                                >
                                    <Mail size={16} />

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
                                        className="register-error"
                                        initial={{ opacity: 0, y: -3 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {errors.email}
                                    </motion.p>
                                )}
                            </div>

                            <div className="register-password-row">
                                <div className="register-field">
                                    <label htmlFor="password">Password</label>

                                    <div
                                        className={`register-input ${errors.password
                                                ? "register-input-error"
                                                : ""
                                            }`}
                                    >
                                        <LockKeyhole size={15} />

                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                        />

                                        <button
                                            type="button"
                                            className="register-eye"
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
                                                <EyeOff size={15} />
                                            ) : (
                                                <Eye size={15} />
                                            )}
                                        </button>
                                    </div>

                                    {errors.password && (
                                        <motion.p
                                            className="register-error"
                                            initial={{ opacity: 0, y: -3 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {errors.password}
                                        </motion.p>
                                    )}
                                </div>

                                <div className="register-field">
                                    <label htmlFor="confirmPassword">
                                        Confirm password
                                    </label>

                                    <div
                                        className={`register-input ${errors.confirmPassword
                                                ? "register-input-error"
                                                : ""
                                            }`}
                                    >
                                        <LockKeyhole size={15} />

                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Confirm"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                        />

                                        <button
                                            type="button"
                                            className="register-eye"
                                            onClick={() =>
                                                setShowConfirmPassword((prev) => !prev)
                                            }
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff size={15} />
                                            ) : (
                                                <Eye size={15} />
                                            )}
                                        </button>
                                    </div>

                                    {errors.confirmPassword && (
                                        <motion.p
                                            className="register-error"
                                            initial={{ opacity: 0, y: -3 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {errors.confirmPassword}
                                        </motion.p>
                                    )}
                                </div>
                            </div>

                            <fieldset className="fh-fandom-picker">
                                <legend>Favourite fandoms <small>(optional, personalises your dashboard)</small></legend>
                                <div>
                                    {FANDOM_CHOICES.map(([slug, label]) => (
                                        <button
                                            key={slug}
                                            type="button"
                                            className={fandoms.includes(slug) ? "active" : ""}
                                            aria-pressed={fandoms.includes(slug)}
                                            onClick={() => toggleFandom(slug)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>

                            {!settings.registrationOpen && (
                                <p className="register-error" style={{ marginBottom: "14px" }}>
                                    Registration is temporarily closed by the administrators.
                                </p>
                            )}

                            <div className="register-terms-wrap">
                                <label className="register-terms">
                                    <input
                                        type="checkbox"
                                        name="terms"
                                        checked={formData.terms}
                                        onChange={handleChange}
                                    />

                                    <span className="register-checkbox" />

                                    <span>
                                        I agree to the{" "}
                                        <Link to="/terms">Terms</Link>
                                        {" & "}
                                        <Link to="/privacy">Privacy Policy</Link>
                                    </span>
                                </label>

                                {errors.terms && (
                                    <p className="register-error register-terms-error">
                                        {errors.terms}
                                    </p>
                                )}
                            </div>

                            {errors.server && (
                                <motion.p
                                    className="register-error"
                                    initial={{ opacity: 0, y: -3 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ marginBottom: "14px" }}
                                >
                                    {errors.server}
                                </motion.p>
                            )}

                            <motion.button
                                type="submit"
                                className="register-submit"
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={submitting}
                            >
                                <span>{submitting ? "Creating account..." : "Create my account"}</span>

                                <span className="register-arrow">
                                    <ArrowRight size={16} />
                                </span>
                            </motion.button>
                        </form>

                        <div className="register-divider">
                            <span />
                            <p>ALREADY IN THE HUB?</p>
                            <span />
                        </div>

                        <p className="register-login">
                            Already have an account?
                            <Link to="/login">Sign in</Link>
                        </p>
                    </div>
                </motion.div>

                <div className="register-image-side">
                    <motion.div
                        className="register-image"
                        initial={{ scale: 1.08 }}
                        animate={{ scale: 1 }}
                        transition={{
                            duration: 1.5,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    />

                    <div className="register-image-overlay" />

                    <motion.div
                        className="register-image-content"
                        initial={{
                            opacity: 0,
                            x: 35,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                        }}
                        transition={{
                            duration: 0.7,
                            delay: 0.35,
                        }}
                    >
                        <div className="register-brand-icon">
                            <Sparkles size={18} />
                        </div>

                        <span className="register-small-title">
                            FANHUB+
                        </span>

                        <h2>
                            Find your people.
                            <br />
                            Live your fandom.
                        </h2>

                        <p>
                            Discover stories, characters and communities
                            built around everything you're obsessed with.
                        </p>

                        <div className="register-image-line">
                            <span />
                            <p>ONE HUB. ENDLESS STORIES.</p>
                        </div>
                    </motion.div>

                    <div className="register-orb register-orb-one" />
                    <div className="register-orb register-orb-two" />
                </div>
            </motion.div>
        </section>
    );
}

export default Register;