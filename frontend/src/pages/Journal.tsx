import { Box, Typography, Paper, TextField, Button, Avatar, Chip, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AutoAwesome, Send } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getBaseUrl } from '../utils/config';

const MotionPaper = motion(Paper);

const FloatingCard = ({ children, delay = 0, sx = {} }: { children: React.ReactNode, delay?: number, sx?: any }) => (
    <MotionPaper
        className="glass-effect"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
        whileHover={{ scale: 1.01, zIndex: 10, transition: { duration: 0.3, ease: 'easeOut' } }}
        sx={{ p: 4, borderRadius: '30px', position: 'relative', overflow: 'hidden', ...sx }}
    >
        {children}
    </MotionPaper>
);

const Journal = () => {
    const { user } = useAuth();
    const [entry, setEntry] = useState('');
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [entries, setEntries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchEntries = async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/journal`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch (error) {
            console.error("Failed to fetch journal entries:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchEntries();
    }, [user]);

    const handleSave = async () => {
        if (!subject || !entry) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${getBaseUrl()}/api/journal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    subject,
                    text: entry,
                    date: date,
                    tags: [] // future enhancement: add tag selector
                })
            });

            if (res.ok) {
                setSubject('');
                setEntry('');
                fetchEntries(); // reload the list
            }
        } catch (error) {
            console.error("Failed to save entry:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const todayFormatted = format(new Date(), 'EEEE, MMMM do, yyyy');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 900, mx: 'auto' }}>
            <FloatingCard delay={0.1}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <AutoAwesome sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Daily Reflections</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Today is {todayFormatted}. Take a moment to log your psychological state and observations.
                </Typography>

                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            fullWidth
                            label="Theme or Subject (e.g., 'Stick to the plan')"
                            variant="outlined"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            sx={{ backgroundColor: 'background.paper', borderRadius: 2, flex: 2, minWidth: 250 }}
                        />
                        <TextField
                            type="date"
                            label="Entry Date"
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
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
                        value={entry}
                        onChange={(e) => setEntry(e.target.value)}
                        sx={{ backgroundColor: 'background.paper', borderRadius: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            disabled={isSaving || !subject || !entry}
                            onClick={handleSave}
                            endIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Send />}
                            size="large"
                            sx={{ borderRadius: '30px', px: 4, py: 1.5, fontWeight: 'bold' }}
                        >
                            {isSaving ? 'Saving...' : 'Save Entry'}
                        </Button>
                    </Box>
                </Box>
            </FloatingCard>

            <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4, mb: 1 }}>Recent Entries</Typography>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : entries.length === 0 ? (
                <Paper className="glass-effect" sx={{ p: 4, textAlign: 'center', borderRadius: '30px' }}>
                    <Typography color="text.secondary">No journal entries found. Write your first reflection above!</Typography>
                </Paper>
            ) : (
                entries.map((item, index) => (
                    <FloatingCard key={item.id} delay={0.2 + (index * 0.1)} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 'bold' }}>
                                    {format(new Date(item.date), 'dd')}
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{item.subject}</Typography>
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
                            {item.text}
                        </Typography>
                    </FloatingCard>
                ))
            )}

        </Box>
    );
};

export default Journal;
