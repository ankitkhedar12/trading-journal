import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button
} from '@mui/material';

interface EditVantageAccountDialogProps {
    open: boolean;
    onClose: () => void;
    accountName: string;
    setAccountName: (val: string) => void;
    depositAmount: number;
    setDepositAmount: (val: number) => void;
    balanceAdjustment: number;
    setBalanceAdjustment: (val: number) => void;
    onUpdate: () => void;
}

const EditVantageAccountDialog: React.FC<EditVantageAccountDialogProps> = ({
    open,
    onClose,
    accountName,
    setAccountName,
    depositAmount,
    setDepositAmount,
    balanceAdjustment,
    setBalanceAdjustment,
    onUpdate
}) => {
    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '30px', minWidth: 450 } }}>
            <DialogTitle sx={{ fontWeight: 'bold', fontSize: '2rem !important' }}>
                Edit Vantage Account
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                <TextField 
                    label="Account Name" 
                    value={accountName} 
                    onChange={(e) => setAccountName(e.target.value)} 
                    fullWidth 
                    required
                />
                <TextField 
                    type="number" 
                    label="Deposit Amount ($)" 
                    value={depositAmount} 
                    onChange={(e) => setDepositAmount(Number(e.target.value))} 
                    fullWidth 
                    required
                />
                <TextField
                    type="number"
                    label="Account Balance Offset ($)"
                    value={balanceAdjustment}
                    onChange={(e) => setBalanceAdjustment(parseFloat(e.target.value) || 0)}
                    fullWidth
                    helperText="Manually adjust your total balance to align with exact missing CSV PnL or commissions."
                />
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={onUpdate}
                    disabled={!accountName || !depositAmount}
                    sx={{ borderRadius: '10px !important', px: 3 }}
                >
                    Update Account
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditVantageAccountDialog;
