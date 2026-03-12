import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContextType';
import { Navigate, Link } from 'react-router-dom';
import { useThemeContext } from '../../context/ThemeContextType';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../utils/validators';
import type { LoginFormData } from '../../utils/validators';
import { sanitizeEmail, isRateLimited } from '../../utils/security';
import { useState } from 'react';

const Login = () => {
    const { mode } = useThemeContext();
    const { login, isAuthenticated } = useAuth();
    const [serverError, setServerError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const onSubmit = async (data: LoginFormData) => {
        if (isRateLimited('login-form', 2000)) {
            setServerError('Too many attempts. Please wait a moment.');
            return;
        }

        setServerError('');
        setIsSubmitting(true);

        const cleanEmail = sanitizeEmail(data.email);
        const success = await login(cleanEmail, data.password);

        if (!success) {
            setServerError('Invalid email or password');
        }
        setIsSubmitting(false);
    };

    return (
        <Box className="auth-page">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="auth-card"
            >
                <Paper className="glass-effect auth-paper">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="auth-logo-container"
                    >
                        <img
                            src={mode === 'dark' ? "/LogoDark.png" : "/LogoLight.png"}
                            alt="AntiGrav"
                            className="auth-logo"
                        />
                    </motion.div>

                    <Typography variant="h4" className="auth-title">
                        AntiGrav
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="auth-subtitle">
                        Sign in to analyze your trades.
                    </Typography>

                    {serverError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{serverError}</Alert>}

                    <Box
                        component="form"
                        onSubmit={handleSubmit(onSubmit)}
                        className="auth-form"
                        noValidate
                    >
                        <TextField
                            margin="normal"
                            fullWidth
                            id="email"
                            label="Email Address"
                            autoComplete="email"
                            autoFocus
                            variant="outlined"
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            {...register('email')}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            variant="outlined"
                            error={!!errors.password}
                            helperText={errors.password?.message}
                            {...register('password')}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={isSubmitting}
                            className="auth-submit-btn"
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography
                                component={Link}
                                to="/forgot-password"
                                variant="body2"
                                className="auth-link"
                                sx={{ color: 'primary.main' }}
                            >
                                Forgot Password?
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </motion.div>
        </Box>
    );
};

export default Login;
