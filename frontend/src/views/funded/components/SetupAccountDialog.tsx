import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, TextField, MenuItem,
    DialogActions, Button
} from '@mui/material';

import type { SetupAccountDialogProps } from '../../../types/account';

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
    onCreate
}) => {
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
                    <MenuItem value="1_STEP">1-Step Evaluation</MenuItem>
                    <MenuItem value="2_STEP">2-Step Evaluation</MenuItem>
                    <MenuItem value="INSTANT">Instant Funding</MenuItem>
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
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={onCreate} sx={{ borderRadius: '10px !important' }}>Save Account</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SetupAccountDialog;
