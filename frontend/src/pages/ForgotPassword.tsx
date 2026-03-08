import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowBack, Email, Lock, CheckCircle } from '@mui/icons-material';
import { useThemeContext } from '../context/ThemeContext';
import { getBaseUrl } from '../utils/config';

type Step = 'email' | 'otp' | 'password' | 'success';

const ForgotPassword = () => {
    const { mode } = useThemeContext();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${getBaseUrl()}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess('A reset code has been sent to your email.');
                setStep('otp');
            } else {
                setError(data.message || 'Failed to send reset code.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (otp.length !== 6) {
            setError('Please enter the full 6-digit code.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${getBaseUrl()}/api/auth/verify-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), code: otp.trim() }),
            });

            const data = await res.json();

            if (res.ok) {
                setResetToken(data.resetToken);
                setStep('password');
            } else {
                setError(data.message || 'Invalid or expired code.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${getBaseUrl()}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetToken, newPassword }),
            });

            const data = await res.json();
            if (res.ok) {
                setStep('success');
            } else {
                setError(data.message || 'Failed to reset password.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const slideVariants = {
        initial: { x: 60, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -60, opacity: 0 },
    };

    const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
        }}>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: '100%', maxWidth: 420 }}
            >
                <Paper
                    className="glass-effect"
                    sx={{
                        p: 5,
                        borderRadius: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        overflow: 'hidden',
                    }}
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        style={{ zIndex: 9999, position: 'relative' }}
                    >
                        <img src={mode === 'dark' ? "/LogoDark.png" : "/LogoLight.png"} alt="AntiGrav" style={{ height: '60px', objectFit: 'contain', display: 'block' }} />
                    </motion.div>

                    <Typography variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 'bold', fontFamily: '"Oleo Script", cursive' }}>
                        AntiGrav
                    </Typography>

                    <AnimatePresence mode="wait">
                        {/* ── Step 1: Email ──────────────────── */}
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

                                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                                <Box component="form" onSubmit={handleSendCode} sx={{ width: '100%' }}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        variant="outlined"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                        sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 3, boxShadow: '0 8px 16px rgba(33, 150, 243, 0.3)' }}
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

                        {/* ── Step 2: OTP ──────────────────────── */}
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
                                    {email}
                                </Typography>

                                {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}
                                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                                <Box component="form" onSubmit={handleVerifyCode} sx={{ width: '100%' }}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Verification Code"
                                        variant="outlined"
                                        value={otp}
                                        onChange={(e) => {
                                            // Allow only digits, max 6
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setOtp(val);
                                        }}
                                        placeholder="000000"
                                        slotProps={{
                                            input: {
                                                style: { letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }
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
                                        disabled={isLoading || otp.length !== 6}
                                        sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 3, boxShadow: '0 8px 16px rgba(33, 150, 243, 0.3)' }}
                                    >
                                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify Code'}
                                    </Button>
                                </Box>

                                <Button
                                    onClick={() => { setStep('email'); setError(''); setSuccess(''); }}
                                    startIcon={<ArrowBack />}
                                    sx={{ mt: 2, textTransform: 'none', fontWeight: 600, width: '100%' }}
                                >
                                    Change Email
                                </Button>
                            </motion.div>
                        )}

                        {/* ── Step 3: New Password ──────────────── */}
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

                                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                                <Box component="form" onSubmit={handleResetPassword} sx={{ width: '100%' }}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="New Password"
                                        type="password"
                                        variant="outlined"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        sx={{ mb: 2 }}
                                        slotProps={{
                                            input: {
                                                startAdornment: <Lock sx={{ color: 'text.secondary', mr: 1 }} />,
                                            }
                                        }}
                                    />
                                    <TextField
                                        required
                                        fullWidth
                                        label="Confirm Password"
                                        type="password"
                                        variant="outlined"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        error={confirmPassword !== '' && newPassword !== confirmPassword}
                                        helperText={confirmPassword !== '' && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
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
                                        disabled={isLoading || !passwordsMatch || newPassword.length < 6}
                                        sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 3, boxShadow: '0 8px 16px rgba(33, 150, 243, 0.3)' }}
                                    >
                                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                                    </Button>
                                </Box>
                            </motion.div>
                        )}

                        {/* ── Step 4: Success ──────────────────── */}
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
                                    sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 3, boxShadow: '0 8px 16px rgba(33, 150, 243, 0.3)' }}
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
