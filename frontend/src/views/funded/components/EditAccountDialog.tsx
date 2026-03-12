import React from 'react';
import { 
    Dialog, DialogTitle, DialogContent, Box, Typography, 
    TextField, MenuItem, DialogActions, Button 
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface EditAccountDialogProps {
    open: boolean;
    onClose: () => void;
    firmName: string;
    accountType: string;
    accountSize: number;
    status: string;
    setStatus: (status: string) => void;
    onUpdate: () => void;
}

const EditAccountDialog: React.FC<EditAccountDialogProps> = ({
    open,
    onClose,
    firmName,
    accountType,
    accountSize,
    status,
    setStatus,
    onUpdate
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            PaperProps={{ sx: { borderRadius: '30px', minWidth: 450 } }}
        >
            <DialogTitle sx={{ fontWeight: 'bold', fontSize: '2rem !important' }}>
                Edit Prop Account Settings
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(244, 67, 54, 0.1)', 
                    borderRadius: '15px', 
                    border: '1px solid rgba(244, 67, 54, 0.3)' 
                }}>
                    <Typography variant="body2" color="error.main" fontWeight="bold" display="flex" alignItems="center">
                        <Warning sx={{ fontSize: 18, mr: 1 }} /> TRADE RESET WARNING
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Manually changing the account status will <strong>DELETE ALL TRADES</strong> associated with {firmName}. This action cannot be undone.
                    </Typography>
                </Box>

                <TextField select label="Firm Name" value={firmName} disabled fullWidth>
                    <MenuItem value={firmName}>{firmName}</MenuItem>
                </TextField>
                <TextField select label="Account Type" value={accountType} disabled fullWidth>
                    <MenuItem value={accountType}>{accountType.replace('_', ' ')}</MenuItem>
                </TextField>
                <TextField type="number" label="Starting Balance ($)" value={accountSize} disabled fullWidth />

                <TextField
                    select
                    label="Update Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    fullWidth
                    autoFocus
                >
                    {accountType !== 'INSTANT' && <MenuItem value="PHASE_1">Phase 1 (Evaluation)</MenuItem>}
                    {accountType === '2_STEP' && <MenuItem value="PHASE_2">Phase 2 (Evaluation)</MenuItem>}
                    <MenuItem value="FUNDED">Funded / Master</MenuItem>
                    <MenuItem value="FAILED" sx={{ color: 'error.main' }}>FAILED (Account Revoked)</MenuItem>
                </TextField>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    variant="contained" 
                    color="error" 
                    onClick={onUpdate} 
                    sx={{ borderRadius: '10px !important', px: 3 }}
                >
                    Reset & Update Status
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditAccountDialog;
