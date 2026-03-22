import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowBack, Email, Lock, CheckCircle } from '@mui/icons-material';
import { useThemeContext } from '../../context/ThemeContextType';
import { getBaseUrl } from '../../utils/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    forgotPasswordEmailSchema,
    otpSchema,
    resetPasswordSchema,
} from '../../utils/validators';
import type {
    ForgotPasswordEmailData,
    OtpFormData,
    ResetPasswordFormData,
} from '../../utils/validators';
import {
    sanitizeEmail,
    sanitizeInput,
    getSecureHeaders,
    isRateLimited,
} from '../../utils/security';

type Step = 'email' | 'otp' | 'password' | 'success';

const ForgotPassword = () => {
    const { mode } = useThemeContext();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [resetToken, setResetToken] = useState('');
    const [serverError, setServerError] = useState('');
    const [serverSuccess, setServerSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailValue, setEmailValue] = useState('');

    // Email form
    const emailForm = useForm<ForgotPasswordEmailData>({
        resolver: zodResolver(forgotPasswordEmailSchema),
        defaultValues: { email: '' },
    });

    // OTP form
    const otpForm = useForm<OtpFormData>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otp: '' },
    });

    // Password form
    const passwordForm = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { newPassword: '', confirmPassword: '' },
    });

    const handleSendCode = async (data: ForgotPasswordEmailData) => {
        if (isRateLimited('forgot-password', 5000)) {
            setServerError('Too many attempts. Please wait a moment.');
            return;
        }
        setServerError('');
        setIsLoading(true);

        const cleanEmail = sanitizeEmail(data.email);
        setEmailValue(cleanEmail);

        try {
            const res = await fetch(`${getBaseUrl()}/api/auth/forgot-password`, {
                method: 'POST',
                headers: getSecureHeaders(),
                body: JSON.stringify({ email: cleanEmail }),
            });

            const resData = await res.json();
            if (res.ok) {
                setServerSuccess('A reset code has been sent to your email.');
                setStep('otp');
            } else {
                setServerError(resData.message || 'Failed to send reset code.');
            }
        } catch {
            setServerError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (data: OtpFormData) => {
        if (isRateLimited('verify-otp', 3000)) {
            setServerError('Too many attempts. Please wait.');
            return;
        }
        setServerError('');
        setServerSuccess('');
        setIsLoading(true);

        try {
            const res = await fetch(`${getBaseUrl()}/api/auth/verify-reset-code`, {
                method: 'POST',
                headers: getSecureHeaders(),
                body: JSON.stringify({
                    email: emailValue,
                    code: sanitizeInput(data.otp, 6),
                }),
            });

            const resData = await res.json();
            if (res.ok) {
                setResetToken(resData.resetToken);
                setStep('password');
            } else {
                setServerError(resData.message || 'Invalid or expired code.');
            }
        } catch {
            setServerError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (data: ResetPasswordFormData) => {
        setServerError('');
        setIsLoading(true);

        try {
            const res = await fetch(`${getBaseUrl()}/api/auth/reset-password`, {
                method: 'POST',
                headers: getSecureHeaders(),
                body: JSON.stringify({ resetToken, newPassword: data.newPassword }),
            });

            const resData = await res.json();
            if (res.ok) {
                setStep('success');
            } else {
                setServerError(resData.message || 'Failed to reset password.');
            }
        } catch {
            setServerError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const slideVariants = {
        initial: { x: 60, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -60, opacity: 0 },
    };

    return (
        <Box className="auth-page">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="auth-card auth-forgot-password-card"
            >
                <Paper className="glass-effect auth-paper" sx={{ overflow: 'hidden' }}>
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

                    <AnimatePresence mode="wait">
                        {/* Step 1: Email */}
                        {step === 'email' && (
                            <motion.div
                                key="email"
                                variants={slideVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                style={{ width: '100%' }}
                            >
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                                    Enter your email to receive a reset code.
                                </Typography>

                                {serverError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{serverError}</Alert>}

                                <Box
                                    component="form"
                                    onSubmit={emailForm.handleSubmit(handleSendCode)}
                                    className="auth-form"
                                    noValidate
                                >
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        variant="outlined"
                                        error={!!emailForm.formState.errors.email}
                                        helperText={emailForm.formState.errors.email?.message}
                                        {...emailForm.register('email')}
                                        sx={{ mb: 3 }}
                                        slotProps={{
                                            input: {
                                                startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />,
                                            }
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={isLoading}
                                        className="auth-submit-btn"
                                    >
                                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Code'}
                                    </Button>
                                </Box>

                                <Button
                                    component={Link}
                                    to="/login"
                                    startIcon={<ArrowBack />}
                                    sx={{ mt: 2, textTransform: 'none', fontWeight: 600, width: '100%' }}
                                >
                                    Back to Login
                                </Button>
                            </motion.div>
                        )}

                        {/* Step 2: OTP */}
                        {step === 'otp' && (
                            <motion.div
                                key="otp"
                                variants={slideVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                style={{ width: '100%' }}
                            >
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                                    Enter the 6-digit code sent to
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>
                                    {emailValue}
                                </Typography>

                                {serverSuccess && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{serverSuccess}</Alert>}
                                {serverError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{serverError}</Alert>}

                                <Box
                                    component="form"
                                    onSubmit={otpForm.handleSubmit(handleVerifyCode)}
                                    className="auth-form"
                                    noValidate
                                >
                                    <TextField
                                        fullWidth
                                        label="Verification Code"
                                        variant="outlined"
                                        placeholder="000000"
                                        error={!!otpForm.formState.errors.otp}
                                        helperText={otpForm.formState.errors.otp?.message}
                                        {...otpForm.register('otp', {
                                            onChange: (e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                otpForm.setValue('otp', val);
                                            },
                                        })}
                                        slotProps={{
                                            input: {
                                                className: 'otp-input',
                                            },
                                            htmlInput: {
                                                maxLength: 6,
                                                inputMode: 'numeric',
                                            }
                                        }}
                                        sx={{ mb: 3 }}
                                    />
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={isLoading}
                                        className="auth-submit-btn"
                                    >
                                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify Code'}
                                    </Button>
                                </Box>

                                <Button
                                    onClick={() => { setStep('email'); setServerError(''); setServerSuccess(''); }}
                                    startIcon={<ArrowBack />}
                                    sx={{ mt: 2, textTransform: 'none', fontWeight: 600, width: '100%' }}
                                >
                                    Change Email
                                </Button>
                            </motion.div>
                        )}

                        {/* Step 3: New Password */}
                        {step === 'password' && (
                            <motion.div
                                key="password"
                                variants={slideVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                style={{ width: '100%' }}
                            >
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                                    Set your new password. (Min 6 characters)
                                </Typography>

                                {serverError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{serverError}</Alert>}

                                <Box
                                    component="form"
                                    onSubmit={passwordForm.handleSubmit(handleResetPassword)}
                                    className="auth-form"
                                    noValidate
                                >
                                    <TextField
                                        fullWidth
                                        label="New Password"
                                        type="password"
                                        variant="outlined"
                                        error={!!passwordForm.formState.errors.newPassword}
                                        helperText={passwordForm.formState.errors.newPassword?.message}
                                        {...passwordForm.register('newPassword')}
                                        sx={{ mb: 2 }}
                                        slotProps={{
                                            input: {
                                                startAdornment: <Lock sx={{ color: 'text.secondary', mr: 1 }} />,
                                            }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Confirm Password"
                                        type="password"
                                        variant="outlined"
                                        error={!!passwordForm.formState.errors.confirmPassword}
                                        helperText={passwordForm.formState.errors.confirmPassword?.message}
                                        {...passwordForm.register('confirmPassword')}
                                        sx={{ mb: 3 }}
                                        slotProps={{
                                            input: {
                                                startAdornment: <Lock sx={{ color: 'text.secondary', mr: 1 }} />,
                                            }
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={isLoading}
                                        className="auth-submit-btn"
                                    >
                                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                                    </Button>
                                </Box>
                            </motion.div>
                        )}

                        {/* Step 4: Success */}
                        {step === 'success' && (
                            <motion.div
                                key="success"
                                variants={slideVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                style={{ width: '100%', textAlign: 'center' }}
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                                >
                                    <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                                </motion.div>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Password Reset!
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Your password has been updated successfully. You can now sign in with your new password.
                                </Typography>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={() => navigate('/login')}
                                    className="auth-submit-btn"
                                >
                                    Go to Login
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Paper>
            </motion.div>
        </Box>
    );
};

export default ForgotPassword;
