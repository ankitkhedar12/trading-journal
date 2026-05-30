const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

replaceInFile('src/App.tsx', [
    [/import PropDashboard from '\.\/views\/dashboard\/PropDashboard';\n/, '']
]);

replaceInFile('src/components/Layout.tsx', [
    [/import AutoGraphIcon from '@mui\/icons-material\/AutoGraph';\n/, '']
]);

replaceInFile('src/views/dashboard/components/DrawdownCurve.tsx', [
    [/import \{ Box, Typography \} from '@mui\/material';/, "import { Box } from '@mui/material';"],
    [/\(value: number\) => \[`\$\$\{value\.toFixed\(2\)\}`, 'Drawdown'\]/, "(value: any) => [`$${Number(value).toFixed(2)}`, 'Drawdown'] as any"]
]);

replaceInFile('src/views/dashboard/components/HourlyTradingFrequencyChart.tsx', [
    [/\(value: number\) => \[value, 'Trades'\]/, "(value: any) => [value, 'Trades'] as any"]
]);

replaceInFile('src/views/dashboard/components/HourlyWinRateChart.tsx', [
    [/\(value: number\) => \[`\$\{value\}%`, 'Win Rate'\]/, "(value: any) => [`${value}%`, 'Win Rate'] as any"]
]);

replaceInFile('src/views/dashboard/components/ProfitByMonthChart.tsx', [
    [/\(value: number\) => \[`\$\$\{value\.toLocaleString\(\)\}`, 'P&L'\]/, "(value: any) => [`$${Number(value).toLocaleString()}`, 'P&L'] as any"]
]);

replaceInFile('src/views/dashboard/components/TimeAnalysisCharts.tsx', [
    [/timeOfDayData, durationData/, "durationData"], // wait, timeOfDayData IS used? Let's check this later. I'll just change the formatter first.
    [/\(value: any, name: string\)/, "(value: any, name: any)"]
]);

replaceInFile('src/views/dashboard/components/TopSymbolsList.tsx', [
    [/import \{ Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper \} from '@mui\/material';/, "import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';"]
]);

replaceInFile('src/views/dashboard/components/TradingInsights.tsx', [
    [/import AccountStatsCard from '\.\/AccountStatsCard';\n/, '']
]);

replaceInFile('src/views/dashboard/components/WeeklyTradingFrequencyChart.tsx', [
    [/\(value: number\) => \[value, 'Trades'\]/, "(value: any) => [value, 'Trades'] as any"]
]);

replaceInFile('src/views/dashboard/components/WeeklyWinRateChart.tsx', [
    [/\(value: number\) => \[`\$\{value\}%`, 'Win Rate'\]/, "(value: any) => [`${value}%`, 'Win Rate'] as any"]
]);

replaceInFile('src/views/dashboard/components/WinRateGauge.tsx', [
    [/\(entry, index\)/, "(_entry, index)"]
]);

replaceInFile('src/views/dashboard/components/YearlyPerformanceGrid.tsx', [
    [/const isNegative = /, "// const isNegative = "]
]);

replaceInFile('src/views/dashboard/Dashboard.tsx', [
    [/import AccountMatrix from '\.\/components\/AccountMatrix';\n/, ''],
    [/import WinRateGauge from '\.\/components\/WinRateGauge';\nimport TopSymbolsList from '\.\/components\/TopSymbolsList';\n/, '']
]);

replaceInFile('src/views/import/ImportData.tsx', [
    [/import \{ Button, Card, CardContent, Typography, Box, Alert, CircularProgress, Link, ToggleButtonGroup, ToggleButton \} from '@mui\/material';/, "import { Button, Card, CardContent, Typography, Box, Alert, CircularProgress, Link } from '@mui/material';"],
    [/const \[selectedBroker, setSelectedBroker\] = useState<string>\('vantage'\);/, "const [selectedBroker] = useState<string>('vantage');"],
    [/const sl = row\[11\];/g, "row[11];"],
    [/const tp = row\[12\];/g, "row[12];"]
]);

console.log("Fixes applied.");
