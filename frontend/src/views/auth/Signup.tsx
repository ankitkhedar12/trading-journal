import { Box, Button, TextField, Typography, Paper, Alert, IconButton, InputAdornment } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContextType';
import { Navigate, Link } from 'react-router-dom';
import { useThemeContext } from '../../context/ThemeContextType';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, otpSchema } from '../../utils/validators';
import type { SignupFormData, OtpFormData } from '../../utils/validators';
import { sanitizeEmail, isRateLimited } from '../../utils/security';
import { useState } from 'react';
import { Eye, EyeOff, UserPlus, CheckCircle2, ArrowLeft } from 'lucide-react';

const Signup = () => {
    const { mode } = useThemeContext();
    const { signup, verifySignup, isAuthenticated } = useAuth();
    const [serverError, setServerError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Stage management
    const [stage, setStage] = useState<'details' | 'otp'>('details');
    const [registeredEmail, setRegisteredEmail] = useState('');

    const {
        register: registerDetails,
        handleSubmit: handleSubmitDetails,
        formState: { errors: detailsErrors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: { email: '', password: '', confirmPassword: '' },
    });

    const {
        register: registerOtp,
        handleSubmit: handleSubmitOtp,
        formState: { errors: otpErrors },
    } = useForm<OtpFormData>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otp: '' },
    });

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const onDetailsSubmit = async (data: SignupFormData) => {
        if (isRateLimited('signup-form', 2000)) {
            setServerError('Too many attempts. Please wait a moment.');
            return;
        }

        setServerError('');
        setIsSubmitting(true);

        const cleanEmail = sanitizeEmail(data.email);
        const result = await signup(cleanEmail, data.password);

        if (result.success && result.requiresVerification) {
            setRegisteredEmail(cleanEmail);
            setStage('otp');
        } else {
            setServerError(result.message || 'Signup failed');
        }
        setIsSubmitting(false);
    };

    const onOtpSubmit = async (data: OtpFormData) => {
        setServerError('');
        setIsSubmitting(true);

        const result = await verifySignup(registeredEmail, data.otp);

        if (!result.success) {
            setServerError(result.message || 'Verification failed');
        }
        setIsSubmitting(false);
    };

    return (
        <Box className="auth-page">
            <motion.div
                key={stage}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
                        {stage === 'details' ? 'Create Account' : 'Verify Email'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="auth-subtitle">
                        {stage === 'details' 
                            ? 'Join AntiGrav to start tracking your journey.' 
                            : `We've sent a 6-digit code to ${registeredEmail}`}
                    </Typography>

                    <AnimatePresence mode="wait">
                        {serverError && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                            >
                                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{serverError}</Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {stage === 'details' ? (
                        <Box
                            component="form"
                            onSubmit={handleSubmitDetails(onDetailsSubmit)}
                            className="auth-form"
                            noValidate
                        >
                            <TextField
                                margin="normal"
                                fullWidth
                                id="email"
                                label="Email Address"
                                autoComplete="email"
                                variant="outlined"
                                error={!!detailsErrors.email}
                                helperText={detailsErrors.email?.message}
                                {...registerDetails('email')}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="new-password"
                                variant="outlined"
                                error={!!detailsErrors.password}
                                helperText={detailsErrors.password?.message}
                                {...registerDetails('password')}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Confirm Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                autoComplete="new-password"
                                variant="outlined"
                                error={!!detailsErrors.confirmPassword}
                                helperText={detailsErrors.confirmPassword?.message}
                                {...registerDetails('confirmPassword')}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 3 }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={isSubmitting}
                                className="auth-submit-btn"
                                startIcon={!isSubmitting && <UserPlus size={20} />}
                            >
                                {isSubmitting ? 'Sending Code...' : 'Sign Up'}
                            </Button>

                            <Box sx={{ textAlign: 'center', mt: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Already have an account?{' '}
                                    <Typography
                                        component={Link}
                                        to="/login"
                                        variant="body2"
                                        className="auth-link"
                                        sx={{ 
                                            color: 'primary.main', 
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        Log In
                                    </Typography>
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Box
                            component="form"
                            onSubmit={handleSubmitOtp(onOtpSubmit)}
                            className="auth-form"
                            noValidate
                        >
                            <TextField
                                margin="normal"
                                fullWidth
                                id="otp"
                                label="Verification Code"
                                autoComplete="one-time-code"
                                variant="outlined"
                                placeholder="000000"
                                error={!!otpErrors.otp}
                                helperText={otpErrors.otp?.message}
                                {...registerOtp('otp')}
                                inputProps={{ 
                                    maxLength: 6,
                                    sx: { textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 'bold' } 
                                }}
                                sx={{ mb: 3 }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={isSubmitting}
                                className="auth-submit-btn"
                                startIcon={!isSubmitting && <CheckCircle2 size={20} />}
                                sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                            >
                                {isSubmitting ? 'Verifying...' : 'Verify & Join'}
                            </Button>

                            <Box sx={{ textAlign: 'center', mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                                <Button 
                                    variant="text" 
                                    size="small" 
                                    onClick={() => setStage('details')}
                                    startIcon={<ArrowLeft size={16} />}
                                    sx={{ color: 'text.secondary' }}
                                >
                                    Change Email
                                </Button>
                                <Button 
                                    variant="text" 
                                    size="small" 
                                    onClick={() => onDetailsSubmit({ email: registeredEmail, password: '', confirmPassword: '' } as any)}
                                    sx={{ color: 'primary.main', fontWeight: 'bold' }}
                                >
                                    Resend Code
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Paper>
            </motion.div>
        </Box>
    );
};

export default Signup;
