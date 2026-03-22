import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { Add, Security } from '@mui/icons-material';
import { useThemeContext } from '../../../context/ThemeContextType';
import SetupAccountDialog from './SetupAccountDialog';

const MotionPaper = motion(Paper);

import type { AccountSetupCenterProps } from '../../../types/account';

const AccountSetupCenter: React.FC<AccountSetupCenterProps> = ({
    openSetup,
    setOpenSetup,
    firmName,
    setFirmName,
    accountType,
    setAccountType,
    accountSize,
    setAccountSize,
    status,
    setStatus,
    hasHftWarning,
    setHasHftWarning,
    onCreate
}) => {
    const { mode } = useThemeContext();
    return (
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '70vh',
            width: '100%'
        }}>
            <MotionPaper
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                elevation={0}
                sx={{
                    p: 6,
                    borderRadius: '40px',
                    background: mode === 'dark' 
                        ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)' 
                        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(241, 245, 249, 1) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: '600px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: mode === 'dark' 
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
                }}
            >
                <Box
                    component={motion.div}
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    sx={{ 
                        p: 3, 
                        borderRadius: '24px', 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mb: 4,
                        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
                    }}
                >
                    <Security sx={{ fontSize: 48, color: 'white' }} />
                </Box>
                
                <Typography variant="h3" gutterBottom fontWeight="900" sx={{ 
                    fontSize: { xs: '2rem', md: '2.8rem' },
                    background: 'linear-gradient(to right, #3b82f6, #9333ea)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2
                }}>
                    Prop Firm Tracker
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: '450px', fontSize: '1.1rem', lineHeight: 1.7 }}>
                    Take control of your evaluation. Track drawdown, consistency, and profit targets with a professional-grade dashboard.
                </Typography>
                
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => setOpenSetup(true)}
                    startIcon={<Add />}
                    sx={{ 
                        borderRadius: '20px !important', 
                        px: 8, 
                        py: 2.5,
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        boxShadow: '0 12px 24px -6px rgba(37, 99, 235, 0.5)',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 15px 30px -8px rgba(37, 99, 235, 0.6)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    Setup New Account
                </Button>
            </MotionPaper>

            <SetupAccountDialog
                open={openSetup}
                onClose={() => setOpenSetup(false)}
                firmName={firmName}
                setFirmName={setFirmName}
                accountType={accountType}
                setAccountType={setAccountType}
                accountSize={accountSize}
                setAccountSize={setAccountSize}
                status={status}
                setStatus={setStatus}
                hasHftWarning={hasHftWarning}
                setHasHftWarning={setHasHftWarning}
                onCreate={onCreate}
            />
        </Box>
    );
};

export default AccountSetupCenter;
