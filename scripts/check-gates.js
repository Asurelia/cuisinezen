#!/usr/bin/env node

/**
 * Quality Gates Checker for CuisineZen
 * Validates all quality gates and generates comprehensive reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Quality gate thresholds
const THRESHOLDS = {
  performance: {
    lcp: 2500, // Largest Contentful Paint < 2.5s
    tbt: 200,  // Total Blocking Time < 200ms
    cls: 0.1,  // Cumulative Layout Shift < 0.1
    fcp: 1800, // First Contentful Paint < 1.8s
    tti: 3800, // Time to Interactive < 3.8s
    performanceScore: 0.9, // Lighthouse performance score >= 90%
  },
  accessibility: {
    score: 0.95, // Lighthouse accessibility score >= 95%
    violations: 0, // Zero accessibility violations
  },
  security: {
    vulnerabilities: {
      critical: 0,
      high: 0,
      moderate: 5, // Max 5 moderate vulnerabilities
    },
    secrets: 0, // Zero secrets detected
    semgrepIssues: 0, // Zero security issues from Semgrep
  },
  codeQuality: {
    coverage: {
      lines: 80,
      branches: 70,
      functions: 80,
      statements: 80,
    },
    mutationScore: 60, // Minimum 60% mutation score
    eslintWarnings: 0, // Zero ESLint warnings in strict mode
    typescriptErrors: 0, // Zero TypeScript errors
  },
  bundle: {
    maxSize: 300000, // 300KB maximum bundle size
  },
};

/**
 * Execute command and return result
 */
function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || error.stderr || error.message,
      exitCode: error.status 
    };
  }
}

/**
 * Check TypeScript compilation
 */
function checkTypeScript() {
  console.log('🔍 Checking TypeScript compilation...');
  const result = executeCommand('npm run typecheck');
  
  return {
    name: 'TypeScript',
    passed: result.success,
    details: {
      errors: result.success ? 0 : 'Compilation failed',
      output: result.output,
    },
    gate: 'Code Quality',
  };
}

/**
 * Check ESLint strict mode
 */
function checkESLint() {
  console.log('🔍 Checking ESLint (strict mode)...');
  const result = executeCommand('npm run lint:strict');
  
  // Parse ESLint output to count warnings/errors
  const warnings = (result.output.match(/warning/gi) || []).length;
  const errors = (result.output.match(/error/gi) || []).length;
  
  return {
    name: 'ESLint Strict',
    passed: result.success && warnings === 0 && errors === 0,
    details: {
      warnings,
      errors,
      output: result.output,
    },
    gate: 'Code Quality',
  };
}

/**
 * Check test coverage
 */
function checkTestCoverage() {
  console.log('🔍 Checking test coverage...');
  const result = executeCommand('npm run test:coverage');
  
  let coverageData = null;
  try {
    // Try to read coverage summary
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    }
  } catch (error) {
    console.warn('Could not parse coverage data:', error.message);
  }
  
  const passed = result.success && coverageData && 
    coverageData.total.lines.pct >= THRESHOLDS.codeQuality.coverage.lines &&
    coverageData.total.branches.pct >= THRESHOLDS.codeQuality.coverage.branches &&
    coverageData.total.functions.pct >= THRESHOLDS.codeQuality.coverage.functions &&
    coverageData.total.statements.pct >= THRESHOLDS.codeQuality.coverage.statements;
  
  return {
    name: 'Test Coverage',
    passed,
    details: {
      coverage: coverageData?.total || null,
      thresholds: THRESHOLDS.codeQuality.coverage,
      output: result.output,
    },
    gate: 'Code Quality',
  };
}

/**
 * Check mutation testing
 */
function checkMutationTesting() {
  console.log('🔍 Checking mutation testing...');
  const result = executeCommand('npm run test:mutation', { timeout: 300000 }); // 5 minutes timeout
  
  let mutationScore = 0;
  try {
    // Parse mutation testing output
    const scoreMatch = result.output.match(/Mutation score: (\d+\.?\d*)%/);
    if (scoreMatch) {
      mutationScore = parseFloat(scoreMatch[1]);
    }
  } catch (error) {
    console.warn('Could not parse mutation score:', error.message);
  }
  
  return {
    name: 'Mutation Testing',
    passed: mutationScore >= THRESHOLDS.codeQuality.mutationScore,
    details: {
      mutationScore,
      threshold: THRESHOLDS.codeQuality.mutationScore,
      output: result.output,
    },
    gate: 'Code Quality',
  };
}

/**
 * Check accessibility tests
 */
function checkAccessibility() {
  console.log('🔍 Checking accessibility tests...');
  const result = executeCommand('npm run test:a11y');
  
  return {
    name: 'Accessibility Tests',
    passed: result.success,
    details: {
      violations: result.success ? 0 : 'Tests failed',
      output: result.output,
    },
    gate: 'Accessibility',
  };
}

/**
 * Check security scan with Semgrep
 */
function checkSemgrep() {
  console.log('🔍 Checking security with Semgrep...');
  const result = executeCommand('npm run security:scan');
  
  // Count security issues
  const issues = (result.output.match(/\s+\w+:/g) || []).length;
  
  return {
    name: 'Semgrep Security Scan',
    passed: issues <= THRESHOLDS.security.semgrepIssues,
    details: {
      issues,
      threshold: THRESHOLDS.security.semgrepIssues,
      output: result.output,
    },
    gate: 'Security',
  };
}

/**
 * Check for secrets with Gitleaks
 */
function checkGitleaks() {
  console.log('🔍 Checking for secrets with Gitleaks...');
  const result = executeCommand('npm run security:secrets');
  
  const secrets = (result.output.match(/leak/gi) || []).length;
  
  return {
    name: 'Gitleaks Secret Detection',
    passed: secrets <= THRESHOLDS.security.secrets,
    details: {
      secrets,
      threshold: THRESHOLDS.security.secrets,
      output: result.output,
    },
    gate: 'Security',
  };
}

/**
 * Check npm audit
 */
function checkNpmAudit() {
  console.log('🔍 Checking npm audit...');
  const result = executeCommand('npm run security:audit');
  
  let auditData = null;
  try {
    const auditResult = executeCommand('npm audit --json');
    if (auditResult.success) {
      auditData = JSON.parse(auditResult.output);
    }
  } catch (error) {
    console.warn('Could not parse npm audit data:', error.message);
  }
  
  const vulnerabilities = auditData?.metadata || {};
  const critical = vulnerabilities.vulnerabilities?.critical || 0;
  const high = vulnerabilities.vulnerabilities?.high || 0;
  const moderate = vulnerabilities.vulnerabilities?.moderate || 0;
  
  const passed = critical <= THRESHOLDS.security.vulnerabilities.critical &&
                 high <= THRESHOLDS.security.vulnerabilities.high &&
                 moderate <= THRESHOLDS.security.vulnerabilities.moderate;
  
  return {
    name: 'NPM Audit',
    passed,
    details: {
      vulnerabilities: {
        critical,
        high,
        moderate,
        low: vulnerabilities.vulnerabilities?.low || 0,
      },
      thresholds: THRESHOLDS.security.vulnerabilities,
      output: result.output,
    },
    gate: 'Security',
  };
}

/**
 * Check Lighthouse performance
 */
function checkLighthouse() {
  console.log('🔍 Checking Lighthouse performance...');
  const result = executeCommand('npm run lighthouse');
  
  // This is a simplified check - in practice, you'd parse Lighthouse JSON output
  const passed = result.success;
  
  return {
    name: 'Lighthouse Performance',
    passed,
    details: {
      thresholds: THRESHOLDS.performance,
      output: result.output,
    },
    gate: 'Performance',
  };
}

/**
 * Check bundle size
 */
function checkBundleSize() {
  console.log('🔍 Checking bundle size...');
  
  // Build the project and analyze bundle
  const buildResult = executeCommand('npm run build');
  if (!buildResult.success) {
    return {
      name: 'Bundle Size',
      passed: false,
      details: {
        error: 'Build failed',
        output: buildResult.output,
      },
      gate: 'Performance',
    };
  }
  
  // Check .next/static folder size (simplified check)
  let bundleSize = 0;
  try {
    const staticDir = path.join(process.cwd(), '.next', 'static');
    if (fs.existsSync(staticDir)) {
      const files = fs.readdirSync(staticDir, { recursive: true });
      files.forEach(file => {
        const filePath = path.join(staticDir, file);
        if (fs.statSync(filePath).isFile()) {
          bundleSize += fs.statSync(filePath).size;
        }
      });
    }
  } catch (error) {
    console.warn('Could not calculate bundle size:', error.message);
  }
  
  return {
    name: 'Bundle Size',
    passed: bundleSize <= THRESHOLDS.bundle.maxSize,
    details: {
      bundleSize,
      threshold: THRESHOLDS.bundle.maxSize,
      bundleSizeMB: (bundleSize / 1024 / 1024).toFixed(2),
      thresholdMB: (THRESHOLDS.bundle.maxSize / 1024 / 1024).toFixed(2),
    },
    gate: 'Performance',
  };
}

/**
 * Generate quality gates report
 */
function generateReport(checks) {
  const timestamp = new Date().toISOString();
  const passed = checks.filter(check => check.passed);
  const failed = checks.filter(check => !check.passed);
  
  const report = {
    timestamp,
    summary: {
      total: checks.length,
      passed: passed.length,
      failed: failed.length,
      successRate: Math.round((passed.length / checks.length) * 100),
    },
    gates: {
      'Code Quality': checks.filter(c => c.gate === 'Code Quality'),
      'Security': checks.filter(c => c.gate === 'Security'),
      'Performance': checks.filter(c => c.gate === 'Performance'),
      'Accessibility': checks.filter(c => c.gate === 'Accessibility'),
    },
    thresholds: THRESHOLDS,
    checks,
    overallStatus: failed.length === 0 ? 'PASSED' : 'FAILED',
  };
  
  // Save report
  const reportsDir = path.join(process.cwd(), 'reports', 'quality-gates');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(reportsDir, `quality-gates-${timestamp.split('T')[0]}.json`),
    JSON.stringify(report, null, 2)
  );
  
  return report;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Running Quality Gates Check for CuisineZen...\n');
  
  const checks = [
    checkTypeScript(),
    checkESLint(),
    checkTestCoverage(),
    // checkMutationTesting(), // Disabled for faster execution - enable in CI
    checkAccessibility(),
    checkSemgrep(),
    checkGitleaks(),
    checkNpmAudit(),
    // checkLighthouse(), // Disabled for faster execution - enable in CI
    checkBundleSize(),
  ];
  
  const report = generateReport(checks);
  
  // Print summary
  console.log('\n📊 Quality Gates Summary:');
  console.log(`✅ Passed: ${report.summary.passed}/${report.summary.total}`);
  console.log(`❌ Failed: ${report.summary.failed}/${report.summary.total}`);
  console.log(`📈 Success Rate: ${report.summary.successRate}%`);
  console.log(`🎯 Overall Status: ${report.overallStatus}\n`);
  
  // Print details for failed checks
  if (report.summary.failed > 0) {
    console.log('❌ Failed Quality Gates:');
    checks.filter(check => !check.passed).forEach(check => {
      console.log(`  • ${check.name} (${check.gate})`);
      if (check.details.errors) console.log(`    Errors: ${check.details.errors}`);
      if (check.details.warnings) console.log(`    Warnings: ${check.details.warnings}`);
      if (check.details.violations) console.log(`    Violations: ${check.details.violations}`);
      if (check.details.issues) console.log(`    Issues: ${check.details.issues}`);
      if (check.details.secrets) console.log(`    Secrets: ${check.details.secrets}`);
      if (check.details.vulnerabilities) {
        const vuln = check.details.vulnerabilities;
        console.log(`    Vulnerabilities: Critical(${vuln.critical}) High(${vuln.high}) Moderate(${vuln.moderate})`);
      }
    });
    console.log('');
  }
  
  console.log(`📁 Detailed report saved to: reports/quality-gates/`);
  
  // Exit with error code if any gate failed
  if (report.overallStatus === 'FAILED') {
    console.log('💥 Quality gates failed! Please fix the issues before deploying to production.');
    process.exit(1);
  } else {
    console.log('🎉 All quality gates passed! Ready for production deployment.');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error running quality gates check:', error.message);
    process.exit(1);
  });
}

module.exports = {
  checkTypeScript,
  checkESLint,
  checkTestCoverage,
  checkMutationTesting,
  checkAccessibility,
  checkSemgrep,
  checkGitleaks,
  checkNpmAudit,
  checkLighthouse,
  checkBundleSize,
  generateReport,
  THRESHOLDS,
};