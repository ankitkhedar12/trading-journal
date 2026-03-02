import { Outlet, NavLink } from 'react-router-dom';
import { Box, Typography, IconButton, Container, Button, Menu, MenuItem, Avatar } from '@mui/material';
import {
    Brightness4,
    Brightness7,
    Dashboard as DashboardIcon,
    FileUpload as FileUploadIcon,
    AutoStories as JournalIcon,
    BarChart as ReportsIcon,
    Settings as SettingsIcon,
    Logout
} from '@mui/icons-material';
import { useThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import { useState } from 'react';

const Layout = () => {
    const { mode, toggleTheme } = useThemeContext();
    const { logout, user } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout();
    };



    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>

            {/* Top Left Logo */}
            <Box component={NavLink} to="/" sx={{ position: 'absolute', top: 24, left: 24, zIndex: 1000 }}>
                <img src="/Logo.png" alt="Journal Logo" style={{ height: '40px', objectFit: 'contain' }} />
            </Box>

            {/* Top Right Controls */}
            <Box sx={{ position: 'absolute', top: 24, right: 24, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: 10 }} className="glass-effect">
                <IconButton onClick={toggleTheme} color="inherit" sx={{ color: 'text.primary' }}>
                    {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>

                <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 'bold' }}>
                        {user?.email?.[0].toUpperCase()}
                    </Avatar>
                </IconButton>
                <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    keepMounted
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    slotProps={{ paper: { sx: { mt: 1, minWidth: 200, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } } }}
                >
                    <MenuItem disabled sx={{ opacity: '1 !important', borderBottom: '1px solid', borderColor: 'divider', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                        <Logout sx={{ mr: 2, fontSize: 20 }} /> Logout
                    </MenuItem>
                </Menu>
            </Box>

            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, pt: { xs: 12, md: 12 }, pb: 16 }}>
                <Container maxWidth="xl">
                    <Outlet />
                </Container>
            </Box>

            {/* Floating Navigation Dock */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    gap: { xs: 0.5, md: 1 },
                    padding: '8px 16px',
                    borderRadius: 8,
                    whiteSpace: 'nowrap',
                    width: { xs: '95%', sm: 'auto' },
                    justifyContent: 'center',
                    overflowX: 'auto',
                    '::-webkit-scrollbar': { display: 'none' }
                }}
                className="glass-effect"
            >
                <Button component={NavLink} to="/dashboard" startIcon={<DashboardIcon />}
                    sx={{ color: 'text.secondary', borderRadius: 4, px: { xs: 2, md: 3 }, py: 1, '&.active': { color: 'primary.main', backgroundColor: 'rgba(33, 150, 243, 0.1)' } }}
                >
                    Dashboard
                </Button>
                <Button component={NavLink} to="/journal" startIcon={<JournalIcon />}
                    sx={{ color: 'text.secondary', borderRadius: 4, px: { xs: 2, md: 3 }, py: 1, '&.active': { color: 'primary.main', backgroundColor: 'rgba(33, 150, 243, 0.1)' } }}
                >
                    Journal
                </Button>
                <Button component={NavLink} to="/reports" startIcon={<ReportsIcon />}
                    sx={{ color: 'text.secondary', borderRadius: 4, px: { xs: 2, md: 3 }, py: 1, '&.active': { color: 'primary.main', backgroundColor: 'rgba(33, 150, 243, 0.1)' } }}
                >
                    Reports
                </Button>
                <Button component={NavLink} to="/import" startIcon={<FileUploadIcon />}
                    sx={{ color: 'text.secondary', borderRadius: 4, px: { xs: 2, md: 3 }, py: 1, '&.active': { color: 'primary.main', backgroundColor: 'rgba(33, 150, 243, 0.1)' } }}
                >
                    Import
                </Button>
                <Button component={NavLink} to="/settings" startIcon={<SettingsIcon />}
                    sx={{ color: 'text.secondary', borderRadius: 4, px: { xs: 2, md: 3 }, py: 1, '&.active': { color: 'primary.main', backgroundColor: 'rgba(33, 150, 243, 0.1)' } }}
                >
                    Settings
                </Button>
            </Box>

            {/* Floating Status Bar (Tech Stack) - Commented out per request 
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: { xs: 'none', lg: 'flex' },
                    gap: 2,
                    padding: '12px 24px',
                    borderRadius: 8,
                    whiteSpace: 'nowrap'
                }}
                className="glass-effect"
            >
                <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    Built with:
                </Typography>
                {techStack.map((tech, i) => (
                    <motion.div
                        key={tech.name}
                        animate={{ y: ["0%", "-15%", "0%"] }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            ease: "easeInOut",
                            times: [0, 0.5, 1],
                            repeat: Infinity,
                            repeatDelay: Math.random()
                        }}
                        style={{ display: 'flex', alignItems: 'center', margin: '0 4px', fontSize: '0.875rem' }}
                    >
                        <Box component="span" sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main',
                            mr: 1,
                            boxShadow: '0 0 8px var(--mui-palette-primary-main)'
                        }} />
                        {tech.name} {i < techStack.length - 1 && <span style={{ marginLeft: 16, opacity: 0.5 }}>|</span>}
                    </motion.div>
                ))}
            </Box>
            */}
        </Box>
    );
};

export default Layout;
