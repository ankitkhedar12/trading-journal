import { Box, Typography, Paper, TextField, Button, Avatar, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { format } from 'date-fns';
import { AutoAwesome, Send } from '@mui/icons-material';

const MotionPaper = motion(Paper);

const FloatingCard = ({ children, delay = 0, sx = {} }: { children: React.ReactNode, delay?: number, sx?: any }) => (
    <MotionPaper
        className="glass-effect"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay }}
        sx={{ p: 4, borderRadius: 4, position: 'relative', overflow: 'hidden', ...sx }}
    >
        {children}
    </MotionPaper>
);

const mockEntries = [
    { id: 1, date: '2026-02-23', subject: 'Patience paid off', text: 'Held my winner and did not exit early. The setups are working when I stick to the plan.', tags: ['Discipline', 'Win'] },
    { id: 2, date: '2026-02-22', subject: 'Overtrading afternoon', text: 'Fomo kicked in after the European session close. Looked for setups that were not there. Took unnecessary losses.', tags: ['FOMO', 'Loss'] }
];

const Journal = () => {
    const [entry, setEntry] = useState('');
    const [subject, setSubject] = useState('');

    const todayFormatted = format(new Date(), 'EEEE, MMMM do, yyyy');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 900, mx: 'auto' }}>
            <FloatingCard delay={0.1}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <AutoAwesome sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Daily Reflections</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Today is {todayFormatted}. Take a moment to log your psychological state and observations from today's session.
                </Typography>

                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        fullWidth
                        label="Theme or Subject (e.g., 'Stick to the plan')"
                        variant="outlined"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        sx={{ backgroundColor: 'background.paper', borderRadius: 2 }}
                    />
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
                            endIcon={<Send />}
                            size="large"
                            sx={{ borderRadius: 8, px: 4, py: 1.5, fontWeight: 'bold' }}
                        >
                            Save Entry
                        </Button>
                    </Box>
                </Box>
            </FloatingCard>

            <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4, mb: 1 }}>Recent Entries</Typography>

            {mockEntries.map((item, index) => (
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
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {item.tags.map(tag => (
                                <Chip key={tag} label={tag} size="small" variant="outlined" color={tag === 'Win' ? 'success' : tag === 'Loss' ? 'error' : 'primary'} />
                            ))}
                        </Box>
                    </Box>
                    <Typography variant="body1" sx={{ mt: 2, color: 'text.primary', lineHeight: 1.6 }}>
                        {item.text}
                    </Typography>
                </FloatingCard>
            ))}

        </Box>
    );
};

export default Journal;
