import { Box, Typography, Card, CardContent, FormControl, RadioGroup, FormControlLabel, Radio, Switch } from '@mui/material';
import { useThemeContext } from '../../context/ThemeContextType';
import { motion } from 'framer-motion';

const Settings = () => {
    const { mode, toggleTheme, glassMode, setGlassMode } = useThemeContext();

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="settings-page"
        >
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 3 }}>
                App Settings
            </Typography>

            <Card className="lg-container" sx={{ background: 'transparent', borderRadius: '40px', overflow: 'visible' }}>
                <div className="lg-filter" />
                <div className="lg-overlay" />
                <div className="lg-specular" />
                <CardContent className="lg-content" sx={{ p: 5, position: 'relative', zIndex: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                        Appearance
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Theme Toggle */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Theme Mode</Typography>
                                <Typography variant="body2" color="text.secondary">Toggle between light and dark mode</Typography>
                            </Box>
                            <FormControlLabel
                                control={<Switch checked={mode === 'dark'} onChange={toggleTheme} color="primary" />}
                                label={mode === 'dark' ? 'Dark' : 'Light'}
                                sx={{ m: 0 }}
                            />
                        </Box>

                        {/* Liquid Glass Toggle */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Liquid Glass Style</Typography>
                                <Typography variant="body2" color="text.secondary">Choose the appearance of floating UI elements</Typography>
                            </Box>

                            <FormControl component="fieldset">
                                <RadioGroup
                                    row
                                    value={glassMode}
                                    onChange={(e) => setGlassMode(e.target.value as 'tinted' | 'clear')}
                                >
                                    <FormControlLabel
                                        value="tinted"
                                        control={<Radio />}
                                        label="Tinted (Frosted)"
                                        sx={{
                                            mr: 4,
                                            '& .MuiTypography-root': { fontWeight: glassMode === 'tinted' ? 700 : 400 }
                                        }}
                                    />
                                    <FormControlLabel
                                        value="clear"
                                        control={<Radio />}
                                        label="Clear (Transparent)"
                                        sx={{
                                            '& .MuiTypography-root': { fontWeight: glassMode === 'clear' ? 700 : 400 }
                                        }}
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Settings;
