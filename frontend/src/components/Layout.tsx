import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Box, Typography, IconButton, Container, Button, Menu, MenuItem, Avatar, useMediaQuery, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import {
    Brightness4,
    Brightness7,
    Dashboard as DashboardIcon,
    FileUpload as FileUploadIcon,
    AutoStories as JournalIcon,
    BarChart as ReportsIcon,
    Settings as SettingsIcon,
    AutoGraph as AutoGraphIcon,
    Logout
} from '@mui/icons-material';
import { useThemeContext } from '../context/ThemeContextType';
import { useAuth } from '../context/AuthContextType';

import { useState } from 'react';

const Layout = () => {
    const { mode, toggleTheme } = useThemeContext();
    const { logout, user } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
            {/* Liquid Mirror SVG Filter (Smooth Lens using radial bump map instead of noise, matching Apple Liquid Glass) */}
            <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
                <filter id="lg-dist" x="0%" y="0%" width="100%" height="100%">
                    <feImage href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%237F7F7F'/%3E%3Cstop offset='90%25' stop-color='%235A5A5A'/%3E%3Cstop offset='100%25' stop-color='%237F7F7F'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E" xlinkHref="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%237F7F7F'/%3E%3Cstop offset='90%25' stop-color='%235A5A5A'/%3E%3Cstop offset='100%25' stop-color='%237F7F7F'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E" result="lensMap" preserveAspectRatio="none" />
                    <feDisplacementMap in="SourceGraphic" in2="lensMap" scale="50" xChannelSelector="R" yChannelSelector="R" />
                </filter>
            </svg>

            {/* Top Left Logo */}
            <Box component={NavLink} to="/" sx={{ position: 'absolute', top: 24, left: 24, zIndex: 9999 }}>
                <img src={mode === 'dark' ? "/LogoDark.png" : "/LogoLight.png"} alt="AntiGrav" style={{ height: '60px', objectFit: 'contain' }} />
            </Box>

            {/* Top Right Controls */}
            <Box className="lg-container" sx={{ position: 'absolute', top: 24, right: 24, zIndex: 1000, borderRadius: '50px' }}>
                <div className="lg-filter" />
                <div className="lg-overlay" />
                <div className="lg-specular" />
                <Box className="lg-content" sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, filter: mode === 'dark' ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' : 'drop-shadow(0 2px 4px rgba(255,255,255,0.9))' }}>
                    <IconButton onClick={toggleTheme} color="inherit" sx={{ color: 'text.primary' }}>
                        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>

                    <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 'bold' }}>
                            {user?.email?.[0].toUpperCase()}
                        </Avatar>
                    </IconButton>
                </Box>
                <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    keepMounted
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    slotProps={{ paper: { sx: { mt: 1, minWidth: 200, borderRadius: '30px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } } }}
                >
                    <MenuItem disabled sx={{ opacity: '1 !important', borderBottom: '1px solid', borderColor: 'divider', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                        <Logout sx={{ mr: 2, fontSize: 20 }} /> Logout
                    </MenuItem>
                </Menu>
            </Box>

            <Box component="main" sx={{ flexGrow: 1, px: { xs: 2, md: 4 }, pt: { xs: 12, md: 12 }, pb: { xs: 15, md: 15 } }}>
                <Container maxWidth="xl" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Outlet />
                </Container>
            </Box>

            {/* Floating Navigation Dock */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: { xs: 32, md: 'auto' },
                    top: { xs: 'auto', md: 24 },
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    width: { xs: 'auto', sm: 'auto' },
                    maxWidth: '95vw'
                }}
            >
                <Box
                    className="lg-container"
                    sx={{
                        borderRadius: '50px',
                        overflowX: 'auto',
                        '::-webkit-scrollbar': { display: 'none' }
                    }}
                >
                    <div className="lg-filter" />
                    <div className="lg-overlay" />
                    <div className="lg-specular" />
                    <Box
                        className="lg-content"
                        sx={{
                            display: 'flex',
                            gap: { xs: 0.5, md: 1 },
                            padding: '8px 12px',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {/* Dynamic Render for Dock Items */}
                        {[
                            { path: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
                            { path: '/funded', icon: <AutoGraphIcon />, label: 'Funded' },
                            { path: '/journal', icon: <JournalIcon />, label: 'Journal' },
                            { path: '/reports', icon: <ReportsIcon />, label: 'Reports' },
                            { path: '/import', icon: <FileUploadIcon />, label: 'Import' },
                            // Settings keeps logic inside conditional
                            ...(!isMobile ? [{ path: '/settings', icon: <SettingsIcon />, label: 'Settings' }] : [])
                        ].map(item => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Button key={item.path} component={NavLink} to={item.path}
                                    sx={{
                                        position: 'relative',
                                        minWidth: { xs: 'auto', sm: 64 },
                                        color: isActive ? 'text.primary' : 'text.secondary',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        borderRadius: '40px',
                                        px: { xs: 1.5, sm: 2, md: 3 },
                                        py: 1.2,
                                        filter: mode === 'dark' ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' : 'drop-shadow(0 1px 3px rgba(255,255,255,1))',
                                        backgroundColor: 'transparent !important', // Removing MUI active class background to prevent overlap
                                        overflow: 'hidden'
                                    }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="waterDropNav"
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 25,
                                                mass: 0.8
                                            }}
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                zIndex: 0,
                                                borderRadius: '40px',
                                                backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.01)' : 'rgba(255, 255, 255, 0.5)',
                                                boxShadow: mode === 'dark'
                                                    ? 'inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.4)'
                                                    : 'inset 2px 2px 4px rgba(255,255,255,0.9), inset -2px -2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.15)'
                                            }}
                                        />
                                    )}
                                    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                                        {item.icon}
                                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: { xs: 0, sm: 1 } }}>
                                            {item.label}
                                        </Box>
                                    </Box>
                                </Button>
                            );
                        })}
                    </Box>
                </Box>

                {/* Separated Settings Button on Mobile */}
                {isMobile && (
                    <Box
                        className="lg-container"
                        sx={{
                            borderRadius: '50px',
                            display: 'flex',
                            alignSelf: 'stretch'
                        }}
                    >
                        <div className="lg-filter" />
                        <div className="lg-overlay" />
                        <div className="lg-specular" />
                        <Box className="lg-content" sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Button component={NavLink} to="/settings"
                                sx={{
                                    position: 'relative',
                                    minWidth: 'auto',
                                    height: '100%',
                                    color: location.pathname.startsWith('/settings') ? 'text.primary' : 'text.secondary',
                                    borderRadius: '50px',
                                    px: 2,
                                    filter: mode === 'dark' ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' : 'drop-shadow(0 1px 3px rgba(255,255,255,1))',
                                    backgroundColor: 'transparent !important',
                                    overflow: 'hidden'
                                }}
                            >
                                {location.pathname.startsWith('/settings') && (
                                    <motion.div
                                        layoutId="waterDropNav"
                                        transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            zIndex: 0,
                                            borderRadius: '50px',
                                            backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.01)' : 'rgba(255, 255, 255, 0.4)',
                                            boxShadow: mode === 'dark'
                                                ? 'inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.4)'
                                                : 'inset 2px 2px 4px rgba(255,255,255,0.9), inset -2px -2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.15)'
                                        }}
                                    />
                                )}
                                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex' }}>
                                    <SettingsIcon />
                                </Box>
                            </Button>
                        </Box>
                    </Box>
                )}
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
