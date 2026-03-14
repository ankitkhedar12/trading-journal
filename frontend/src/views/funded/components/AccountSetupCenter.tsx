import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { Add, Security } from '@mui/icons-material';
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
    onCreate
}) => {
    return (
        <Box className="funded-setup-center">
            <MotionPaper
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="funded-setup-card"
                elevation={4}
            >
                <Security sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom fontWeight="bold">Prop Firm Tracker</Typography>
                <Typography color="text.secondary" mb={4}>
                    Track your daily drawdown, profit targets, and consistency rules automatically using your imported trades.
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => setOpenSetup(true)}
                    startIcon={<Add />}
                    sx={{ borderRadius: '10px !important', px: 4, py: 1.5 }}
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
                onCreate={onCreate}
            />
        </Box>
    );
};

export default AccountSetupCenter;
