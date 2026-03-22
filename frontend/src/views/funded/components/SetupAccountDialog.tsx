import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, TextField, MenuItem,
    DialogActions, Button, FormControlLabel, Checkbox, Typography
} from '@mui/material';

import type { SetupAccountDialogProps } from '../../../types/account';
import { useThemeContext } from '../../../context/ThemeContextType';

const SetupAccountDialog: React.FC<SetupAccountDialogProps> = ({
    open,
    onClose,
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
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '15px', minWidth: 400 } }}>
            <DialogTitle sx={{ fontWeight: 'bold', fontSize: '2rem !important' }}>Setup Prop Account</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField select label="Firm Name" value={firmName} onChange={(e) => setFirmName(e.target.value)} fullWidth>
                    <MenuItem value="The Funded Room">The Funded Room</MenuItem>
                    <MenuItem value="FTMO">FTMO</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                </TextField>
                <TextField select label="Account Type" value={accountType} onChange={(e) => setAccountType(e.target.value)} fullWidth sx={{ mt: 1 }}>
                    <MenuItem value="1_STEP">One-Step Challenge</MenuItem>
                    <MenuItem value="2_STEP">Two-Step Challenge</MenuItem>
                    <MenuItem value="INSTANT">Instant Funded Account</MenuItem>
                </TextField>
                <TextField type="number" label="Account Size ($)" value={accountSize} onChange={(e) => setAccountSize(Number(e.target.value))} fullWidth sx={{ mt: 1 }} />
                <TextField
                    select
                    label="Current Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    fullWidth
                    sx={{ mt: 1 }}
                >
                    {accountType !== 'INSTANT' && <MenuItem value="PHASE_1">Phase 1 (Evaluation)</MenuItem>}
                    {accountType === '2_STEP' && <MenuItem value="PHASE_2">Phase 2 (Evaluation)</MenuItem>}
                    <MenuItem value="FUNDED">Funded / Master</MenuItem>
                    <MenuItem value="FAILED" sx={{ color: 'error.main' }}>FAILED (Account Revoked)</MenuItem>
                </TextField>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={hasHftWarning}
                            onChange={(e) => setHasHftWarning(e.target.checked)}
                            color="primary"
                        />
                    }
                    label={<Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem', color: mode === 'dark' ? 'white' : 'black' }}>Account has HFT Warning</Typography>}
                    sx={{ mt: 1 }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 4 }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={onCreate}
                    sx={{
                        borderRadius: '15px !important',
                        px: 4,
                        py: 1.2,
                        fontWeight: 'bold',
                        boxShadow: '0 8px 16px rgba(33, 150, 243, 0.2)'
                    }}
                >
                    Save Account
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SetupAccountDialog;
