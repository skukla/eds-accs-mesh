#!/usr/bin/env node

/**
 * Build script to convert mesh.config.js to mesh.json
 * Simplified version for ACCS mesh (no custom resolvers or schema extensions)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Check if ora and chalk are available
let ora, chalk;
try {
  ora = require('ora');
} catch {
  // Fallback if ora is not installed
  ora = (options) => ({
    start: () => {
      console.log(options.text || options);
      return { stop: () => {}, fail: () => {} };
    },
  });
}

try {
  chalk = require('chalk');
} catch {
  // Fallback if chalk is not installed
  chalk = {
    green: (str) => str,
    red: (str) => str,
    yellow: (str) => str,
    blue: (str) => str,
    cyan: (str) => str,
    gray: (str) => str,
    bold: { green: (str) => str },
  };
}

// Formatting helpers
const format = {
  success: (msg) => chalk.green(`✔ ${msg}`),
  majorSuccess: (msg) => chalk.green(`✅ ${msg}`),
  error: (msg) => chalk.red(`✖ ${msg}`),
  warning: (msg) => chalk.yellow(`⚠ ${msg}`),
  muted: (msg) => chalk.gray(msg),
  deploymentStart: (msg) => chalk.cyan(`🚀 ${msg}`),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/**
 * Get hash of source files to detect changes
 */
function getMeshSourceHash() {
  try {
    let combinedContent = '';

    // Include mesh config
    const meshConfigPath = path.join(__dirname, '..', 'mesh.config.js');
    if (fs.existsSync(meshConfigPath)) {
      combinedContent += fs.readFileSync(meshConfigPath, 'utf8');
    }

    return crypto.createHash('md5').update(combinedContent).digest('hex');
  } catch (error) {
    console.warn('Hash calculation failed:', error.message);
    return null;
  }
}

/**
 * Get stored hash from last build
 */
function getStoredMeshHash() {
  try {
    const hashPath = path.join(__dirname, '..', '.mesh-build-hash');
    return fs.readFileSync(hashPath, 'utf8').trim();
  } catch {
    return null;
  }
}

/**
 * Store hash for change detection
 */
function storeMeshHash(hash) {
  const hashPath = path.join(__dirname, '..', '.mesh-build-hash');
  fs.writeFileSync(hashPath, hash);
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const parsed = { params: {} };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      parsed[key] = value || true;
    }
  }

  return parsed;
}

async function generateMeshConfig() {
  const spinner = ora({
    text: format.muted('Generating mesh configuration'),
    spinner: 'dots',
  }).start();

  try {
    // Load the mesh configuration
    const meshConfigPath = path.join(__dirname, '..', 'mesh.config.js');

    if (!fs.existsSync(meshConfigPath)) {
      spinner.stop();
      console.log(format.warning('No mesh.config.js found, skipping'));
      return false;
    }

    // Clear require cache to get fresh config
    delete require.cache[require.resolve(meshConfigPath)];
    const meshConfig = require(meshConfigPath);

    // Validate configuration structure
    if (!meshConfig.meshConfig) {
      throw new Error('mesh.config.js must export a meshConfig object');
    }

    // ACCS mesh is simple - no custom schema or resolvers needed
    // additionalTypeDefs and additionalResolvers stay empty

    // Write the configuration to mesh.json
    const meshJsonPath = path.join(__dirname, '..', 'mesh.json');
    fs.writeFileSync(meshJsonPath, JSON.stringify(meshConfig, null, 2), 'utf8');

    // Verify the output is valid JSON
    const written = fs.readFileSync(meshJsonPath, 'utf8');
    JSON.parse(written);

    spinner.stop();
    console.log(format.success('Mesh configuration generated (mesh.json)'));
    console.log(format.muted('  - ACCS supergraph passthrough (single source)'));

    return true;
  } catch (error) {
    spinner.stop();
    console.log(format.error(`Mesh config generation failed: ${error.message}`));
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Usage: npm run build [options]

Options:
  --help          Show this help message
  --force         Force rebuild even if no changes detected

This script converts mesh.config.js into the mesh.json
format required by Adobe API Mesh.
    `);
    return;
  }

  console.log(format.deploymentStart('Build started'));
  console.log();
  await format.sleep(500);

  try {
    // Check if rebuild is needed
    const currentHash = getMeshSourceHash();
    const storedHash = getStoredMeshHash();

    if (!args.force && currentHash === storedHash) {
      console.log(format.muted('No changes detected in mesh configuration'));
      console.log(format.success('Build skipped (use --force to rebuild)'));
      return;
    }

    // Generate mesh configuration
    const success = await generateMeshConfig();

    if (success) {
      // Store the hash for next time
      if (currentHash) {
        storeMeshHash(currentHash);
      }

      console.log();
      console.log(format.majorSuccess('Build completed successfully'));
    }
  } catch (error) {
    console.error(format.error('Build failed:'), error.message);
    if (error.stack && args.verbose) {
      console.error(format.muted(error.stack));
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error(format.error('Build failed:'), error.message);
    process.exit(1);
  });
}

module.exports = { generateMeshConfig, getMeshSourceHash };
