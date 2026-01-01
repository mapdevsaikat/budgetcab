#!/usr/bin/env node

/**
 * Environment Setup Checker for MaahiCabs
 * Run this script to verify your .env.local configuration
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};

const requiredVars = [
    {
        name: 'NEXT_PUBLIC_SUPABASE_URL',
        description: 'Supabase Project URL',
        required: true,
        example: 'https://your-project.supabase.co',
    },
    {
        name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        description: 'Supabase Anon Key',
        required: true,
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
    {
        name: 'QUANTAROUTE_API_KEY',
        description: 'QuantaRoute Geocoding API Key',
        required: true,
        example: 'qr_xxxxxxxxxxxxxxxx',
    },
    {
        name: 'NEXT_PUBLIC_MAPTILER_API_KEY',
        description: 'MapTiler API Key for map tiles',
        required: true,
        example: 'xxxxxxxxxxxxxxxxx',
    },
    {
        name: 'MAPBOX_API_KEY',
        description: 'Mapbox API Key for routing',
        required: true,
        example: 'pk.xxxxxxxxxxxxxxxxx',
    },
];

function printHeader() {
    console.log(`\n${colors.bold}${colors.cyan}╔═══════════════════════════════════════════╗`);
    console.log(`║   MaahiCabs Environment Setup Checker    ║`);
    console.log(`╚═══════════════════════════════════════════╝${colors.reset}\n`);
}

function checkEnvFile() {
    const envPath = path.join(process.cwd(), '.env.local');
    const envExists = fs.existsSync(envPath);

    if (!envExists) {
        console.log(`${colors.red}✗ .env.local file not found!${colors.reset}\n`);
        console.log(`${colors.yellow}To create it:${colors.reset}`);
        console.log(`1. Copy the template: ${colors.cyan}cp .env.local.example .env.local${colors.reset}`);
        console.log(`2. Or create a new file: ${colors.cyan}.env.local${colors.reset}`);
        console.log(`3. Add your API keys (see SETUP.md for details)\n`);
        return null;
    }

    console.log(`${colors.green}✓ .env.local file found${colors.reset}\n`);

    // Read and parse .env.local
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });

    return envVars;
}

function checkVariables(envVars) {
    if (!envVars) return;

    console.log(`${colors.bold}Checking environment variables:${colors.reset}\n`);

    let hasErrors = false;
    let hasWarnings = false;

    requiredVars.forEach(variable => {
        const value = envVars[variable.name];
        const hasValue = value && value.length > 0 && !value.includes('your-');

        if (!hasValue) {
            console.log(`${colors.red}✗ ${variable.name}${colors.reset}`);
            console.log(`  ${colors.yellow}Missing or placeholder value${colors.reset}`);
            console.log(`  ${colors.cyan}Example: ${variable.example}${colors.reset}`);
            console.log(`  ${variable.description}\n`);
            hasErrors = true;
        } else {
            // Check for common placeholder values
            const isPlaceholder = 
                value === 'placeholder' ||
                value === 'your-project.supabase.co' ||
                value.includes('your-') ||
                value.includes('xxx');

            if (isPlaceholder) {
                console.log(`${colors.yellow}⚠ ${variable.name}${colors.reset}`);
                console.log(`  ${colors.yellow}Appears to be a placeholder value${colors.reset}`);
                console.log(`  ${colors.cyan}Current: ${value}${colors.reset}\n`);
                hasWarnings = true;
            } else {
                const displayValue = value.length > 30 ? value.substring(0, 27) + '...' : value;
                console.log(`${colors.green}✓ ${variable.name}${colors.reset}`);
                console.log(`  ${colors.cyan}${displayValue}${colors.reset}\n`);
            }
        }
    });

    // Summary
    console.log(`${colors.bold}═══════════════════════════════════════${colors.reset}\n`);

    if (!hasErrors && !hasWarnings) {
        console.log(`${colors.green}${colors.bold}✓ All environment variables are configured!${colors.reset}`);
        console.log(`${colors.green}You can now run: ${colors.cyan}npm run dev${colors.reset}\n`);
        console.log(`${colors.cyan}Visit http://localhost:3000/diagnostics to verify services${colors.reset}\n`);
    } else if (hasErrors) {
        console.log(`${colors.red}${colors.bold}✗ Configuration incomplete${colors.reset}`);
        console.log(`${colors.yellow}Please add the missing variables to .env.local${colors.reset}`);
        console.log(`${colors.cyan}See SETUP.md for detailed instructions${colors.reset}\n`);
    } else if (hasWarnings) {
        console.log(`${colors.yellow}${colors.bold}⚠ Warnings detected${colors.reset}`);
        console.log(`${colors.yellow}Some values appear to be placeholders${colors.reset}`);
        console.log(`${colors.cyan}Update them with your actual API keys${colors.reset}\n`);
    }
}

function main() {
    printHeader();
    const envVars = checkEnvFile();
    checkVariables(envVars);
}

main();

