import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button
} from '@mui/material';

interface SetupVantageAccountDialogProps {
    open: boolean;
    onClose: () => void;
    accountName: string;
    setAccountName: (val: string) => void;
    depositAmount: number;
    setDepositAmount: (val: number) => void;
    onCreate: () => void;
}

const SetupVantageAccountDialog: React.FC<SetupVantageAccountDialogProps> = ({
    open,
    onClose,
    accountName,
    setAccountName,
    depositAmount,
    setDepositAmount,
    onCreate
}) => {
    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '15px', minWidth: 400 } }}>
            <DialogTitle sx={{ fontWeight: 'bold', fontSize: '2rem !important' }}>Setup Vantage Account</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField 
                    label="Account Name" 
                    placeholder="e.g., Live 1, Demo Account" 
                    value={accountName} 
                    onChange={(e) => setAccountName(e.target.value)} 
                    fullWidth 
                    required
                />
                <TextField 
                    type="number" 
                    label="Deposit Amount ($)" 
                    placeholder="Starting Balance"
                    value={depositAmount || ''} 
                    onChange={(e) => setDepositAmount(Number(e.target.value))} 
                    fullWidth 
                    sx={{ mt: 1 }} 
                    required
                />
            </DialogContent>
            <DialogActions sx={{ p: 4 }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={onCreate}
                    disabled={!accountName || !depositAmount}
                    sx={{
                        borderRadius: '15px !important',
                        px: 4,
                        py: 1.2,
                        fontWeight: 'bold',
                        boxShadow: '0 8px 16px rgba(33, 150, 243, 0.2)'
                    }}
                >
                    Create Account
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SetupVantageAccountDialog;
