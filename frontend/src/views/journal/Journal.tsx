import { Box, Typography, Paper, TextField, Button, Avatar, Chip, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AutoAwesome, Send } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContextType';
import { getBaseUrl } from '../../utils/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { journalEntrySchema } from '../../utils/validators';
import type { JournalEntryFormData } from '../../utils/validators';
import { sanitizeInput, sanitizeHtml, getSecureHeaders } from '../../utils/security';

import FloatingCard from '../../components/common/FloatingCard';

interface JournalEntry {
    id: string;
    subject: string;
    text: string;
    date: string;
    tags: string[];
}



const Journal = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoadingEntries, setIsLoadingEntries] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<JournalEntryFormData>({
        resolver: zodResolver(journalEntrySchema),
        defaultValues: {
            subject: '',
            text: '',
            date: format(new Date(), 'yyyy-MM-dd'),
        },
    });

    const fetchEntries = async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/journal`, {
                headers: getSecureHeaders(user?.token),
            });
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch {
            // Silently fail — logged server-side
        } finally {
            setIsLoadingEntries(false);
        }
    };

    useEffect(() => {
        if (user) fetchEntries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const onSubmit = async (data: JournalEntryFormData) => {
        setIsSaving(true);
        try {
            const res = await fetch(`${getBaseUrl()}/api/journal`, {
                method: 'POST',
                headers: getSecureHeaders(user?.token),
                body: JSON.stringify({
                    subject: sanitizeInput(data.subject, 200),
                    text: sanitizeInput(data.text, 10000),
                    date: data.date,
                    tags: [],
                }),
            });

            if (res.ok) {
                reset({
                    subject: '',
                    text: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                });
                fetchEntries();
            }
        } catch {
            // Silently fail
        } finally {
            setIsSaving(false);
        }
    };

    const todayFormatted = format(new Date(), 'EEEE, MMMM do, yyyy');

    return (
        <Box className="journal-page">
            <FloatingCard delay={0.1} sx={{ borderRadius: '30px' }}>
                <Box className="journal-header">
                    <AutoAwesome sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Daily Reflections</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Today is {todayFormatted}. Take a moment to log your psychological state and observations.
                </Typography>

                <Box
                    component="form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="journal-form"
                    noValidate
                >
                    <Box className="journal-form-row">
                        <TextField
                            fullWidth
                            label="Theme or Subject (e.g., 'Stick to the plan')"
                            variant="outlined"
                            error={!!errors.subject}
                            helperText={errors.subject?.message}
                            {...register('subject')}
                            sx={{ backgroundColor: 'background.paper', borderRadius: 2, flex: 2, minWidth: 250 }}
                        />
                        <TextField
                            type="date"
                            label="Entry Date"
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.date}
                            helperText={errors.date?.message}
                            {...register('date')}
                            sx={{ backgroundColor: 'background.paper', borderRadius: 2, flex: 1, minWidth: 150 }}
                        />
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Journal Entry"
                        placeholder="What did you do well? What could you improve?"
                        variant="outlined"
                        error={!!errors.text}
                        helperText={errors.text?.message}
                        {...register('text')}
                        sx={{ backgroundColor: 'background.paper', borderRadius: 2 }}
                    />
                    <Box className="journal-submit-row">
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSaving}
                            endIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Send />}
                            size="large"
                            sx={{ px: 6, py: 2, borderRadius: '30px', fontSize: '1.1rem', fontWeight: 'bold' }}
                        >
                            {isSaving ? 'Saving...' : 'Save Entry'}
                        </Button>
                    </Box>
                </Box>
            </FloatingCard>

            <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4, mb: 1 }}>Recent Entries</Typography>

            {isLoadingEntries ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : entries.length === 0 ? (
                <Paper className="glass-effect" sx={{ p: 4, textAlign: 'center', borderRadius: '30px' }}>
                    <Typography color="text.secondary">No journal entries found. Write your first reflection above!</Typography>
                </Paper>
            ) : (
                entries.map((item, index) => (
                    <FloatingCard key={item.id} delay={0.2 + (index * 0.1)} sx={{ p: 3, borderRadius: '30px' }}>
                        <Box className="journal-entry-header">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 'bold' }}>
                                    {format(new Date(item.date), 'dd')}
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{sanitizeHtml(item.subject)}</Typography>
                                    <Typography variant="caption" color="text.secondary">{format(new Date(item.date), 'MMMM do, yyyy')}</Typography>
                                </Box>
                            </Box>
                            {item.tags && item.tags.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {item.tags.map((tag: string) => (
                                        <Chip key={tag} label={tag} size="small" variant="outlined" color={tag === 'Win' ? 'success' : tag === 'Loss' ? 'error' : 'primary'} />
                                    ))}
                                </Box>
                            )}
                        </Box>
                        <Typography variant="body1" sx={{ mt: 2, color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {sanitizeHtml(item.text)}
                        </Typography>
                    </FloatingCard>
                ))
            )}
        </Box>
    );
};

export default Journal;
