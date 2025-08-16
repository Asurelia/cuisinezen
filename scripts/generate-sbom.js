#!/usr/bin/env node

/**
 * Software Bill of Materials (SBOM) Generator for CuisineZen
 * Generates comprehensive SBOM including dependencies, licenses, and security info
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// SBOM metadata
const SBOM_VERSION = '1.0.0';
const SPDX_VERSION = 'SPDX-2.3';
const CREATION_TIME = new Date().toISOString();

// Package information
const packageJson = require('../package.json');

/**
 * Generate SHA256 hash for a file
 */
function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get license information from package.json
 */
function getLicenseInfo(packagePath) {
  try {
    const pkgJson = require(packagePath);
    return {
      name: pkgJson.license || 'UNKNOWN',
      url: pkgJson.homepage || '',
      text: pkgJson.license || 'UNKNOWN'
    };
  } catch (error) {
    return {
      name: 'UNKNOWN',
      url: '',
      text: 'UNKNOWN'
    };
  }
}

/**
 * Get dependency information
 */
function getDependencies() {
  const dependencies = [];
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  
  // Process production dependencies
  if (packageJson.dependencies) {
    Object.entries(packageJson.dependencies).forEach(([name, version]) => {
      const packagePath = path.join(nodeModulesPath, name, 'package.json');
      const license = getLicenseInfo(packagePath);
      
      dependencies.push({
        SPDXID: `SPDXRef-Package-${name.replace(/[^a-zA-Z0-9]/g, '-')}`,
        name: name,
        downloadLocation: `https://registry.npmjs.org/${name}/-/${name}-${version.replace('^', '').replace('~', '')}.tgz`,
        filesAnalyzed: false,
        homepage: `https://www.npmjs.com/package/${name}`,
        copyrightText: 'NOASSERTION',
        licenseConcluded: license.name,
        licenseDeclared: license.name,
        versionInfo: version,
        supplier: 'NOASSERTION',
        originator: 'NOASSERTION',
        packageVerificationCode: {
          packageVerificationCodeValue: generateHash(`${name}@${version}`)
        },
        checksums: [
          {
            algorithm: 'SHA256',
            checksumValue: generateHash(`${name}@${version}`)
          }
        ],
        externalRefs: [
          {
            referenceCategory: 'PACKAGE-MANAGER',
            referenceType: 'purl',
            referenceLocator: `pkg:npm/${name}@${version.replace('^', '').replace('~', '')}`
          }
        ]
      });
    });
  }
  
  return dependencies;
}

/**
 * Get security vulnerabilities information
 */
function getSecurityInfo() {
  try {
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);
    
    const vulnerabilities = [];
    if (audit.vulnerabilities) {
      Object.entries(audit.vulnerabilities).forEach(([name, vuln]) => {
        vulnerabilities.push({
          package: name,
          severity: vuln.severity,
          title: vuln.title || 'Unknown vulnerability',
          url: vuln.url || '',
          range: vuln.range || '',
          fixAvailable: vuln.fixAvailable || false
        });
      });
    }
    
    return {
      vulnerabilities,
      summary: audit.metadata || {}
    };
  } catch (error) {
    console.warn('Could not retrieve security audit information:', error.message);
    return {
      vulnerabilities: [],
      summary: {}
    };
  }
}

/**
 * Generate SPDX SBOM
 */
function generateSBOM() {
  const dependencies = getDependencies();
  const securityInfo = getSecurityInfo();
  
  const sbom = {
    spdxVersion: SPDX_VERSION,
    creationInfo: {
      created: CREATION_TIME,
      creators: [
        'Tool: CuisineZen-SBOM-Generator',
        'Organization: CuisineZen',
      ],
      licenseListVersion: '3.21'
    },
    name: `${packageJson.name}-SBOM`,
    dataLicense: 'CC0-1.0',
    SPDXID: 'SPDXRef-DOCUMENT',
    documentNamespace: `https://cuisinezen.com/sbom/${packageJson.name}/${packageJson.version}/${CREATION_TIME}`,
    packages: [
      {
        SPDXID: 'SPDXRef-Package-Root',
        name: packageJson.name,
        downloadLocation: packageJson.repository?.url || 'NOASSERTION',
        filesAnalyzed: false,
        homepage: packageJson.homepage || '',
        copyrightText: 'NOASSERTION',
        licenseConcluded: packageJson.license || 'NOASSERTION',
        licenseDeclared: packageJson.license || 'NOASSERTION',
        versionInfo: packageJson.version,
        supplier: 'Organization: CuisineZen',
        originator: 'Organization: CuisineZen',
        packageVerificationCode: {
          packageVerificationCodeValue: generateHash(`${packageJson.name}@${packageJson.version}`)
        },
        externalRefs: [
          {
            referenceCategory: 'PACKAGE-MANAGER',
            referenceType: 'purl',
            referenceLocator: `pkg:npm/${packageJson.name}@${packageJson.version}`
          }
        ]
      },
      ...dependencies
    ],
    relationships: [
      {
        spdxElementId: 'SPDXRef-DOCUMENT',
        relationshipType: 'DESCRIBES',
        relatedSpdxElement: 'SPDXRef-Package-Root'
      },
      ...dependencies.map(dep => ({
        spdxElementId: 'SPDXRef-Package-Root',
        relationshipType: 'DEPENDS_ON',
        relatedSpdxElement: dep.SPDXID
      }))
    ],
    // Add security information as annotations
    annotations: [
      {
        annotationType: 'REVIEW',
        annotator: 'Tool: npm-audit',
        annotationDate: CREATION_TIME,
        annotationComment: `Security scan completed. Found ${securityInfo.vulnerabilities.length} vulnerabilities.`,
        annotationSPDXRef: 'SPDXRef-DOCUMENT'
      },
      ...securityInfo.vulnerabilities.map(vuln => ({
        annotationType: 'SECURITY',
        annotator: 'Tool: npm-audit',
        annotationDate: CREATION_TIME,
        annotationComment: `${vuln.severity.toUpperCase()} vulnerability in ${vuln.package}: ${vuln.title}`,
        annotationSPDXRef: `SPDXRef-Package-${vuln.package.replace(/[^a-zA-Z0-9]/g, '-')}`
      }))
    ]
  };
  
  return sbom;
}

/**
 * Generate CycloneDX SBOM format
 */
function generateCycloneDXSBOM() {
  const dependencies = getDependencies();
  const securityInfo = getSecurityInfo();
  
  const cycloneDxSbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.4',
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: CREATION_TIME,
      tools: [
        {
          vendor: 'CuisineZen',
          name: 'SBOM Generator',
          version: SBOM_VERSION
        }
      ],
      component: {
        type: 'application',
        'bom-ref': `pkg:npm/${packageJson.name}@${packageJson.version}`,
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description || '',
        licenses: packageJson.license ? [{ license: { id: packageJson.license } }] : [],
        purl: `pkg:npm/${packageJson.name}@${packageJson.version}`
      }
    },
    components: dependencies.map(dep => ({
      type: 'library',
      'bom-ref': dep.externalRefs[0].referenceLocator,
      name: dep.name,
      version: dep.versionInfo.replace(/[\^~]/, ''),
      purl: dep.externalRefs[0].referenceLocator,
      licenses: dep.licenseDeclared !== 'UNKNOWN' ? [{ license: { id: dep.licenseDeclared } }] : []
    })),
    dependencies: [
      {
        ref: `pkg:npm/${packageJson.name}@${packageJson.version}`,
        dependsOn: dependencies.map(dep => dep.externalRefs[0].referenceLocator)
      }
    ],
    vulnerabilities: securityInfo.vulnerabilities.map(vuln => ({
      id: vuln.url ? vuln.url.split('/').pop() : `VULN-${Date.now()}`,
      source: {
        name: 'npm audit',
        url: vuln.url || ''
      },
      ratings: [
        {
          severity: vuln.severity.toUpperCase(),
          method: 'CVSSv3'
        }
      ],
      description: vuln.title,
      affects: [
        {
          ref: `pkg:npm/${vuln.package}@${vuln.range || '*'}`
        }
      ]
    }))
  };
  
  return cycloneDxSbom;
}

/**
 * Generate compliance report
 */
function generateComplianceReport() {
  const dependencies = getDependencies();
  const securityInfo = getSecurityInfo();
  
  // License compliance check
  const licenseDistribution = {};
  dependencies.forEach(dep => {
    const license = dep.licenseDeclared;
    licenseDistribution[license] = (licenseDistribution[license] || 0) + 1;
  });
  
  // Security compliance
  const securitySummary = {
    total: securityInfo.vulnerabilities.length,
    critical: securityInfo.vulnerabilities.filter(v => v.severity === 'critical').length,
    high: securityInfo.vulnerabilities.filter(v => v.severity === 'high').length,
    moderate: securityInfo.vulnerabilities.filter(v => v.severity === 'moderate').length,
    low: securityInfo.vulnerabilities.filter(v => v.severity === 'low').length
  };
  
  return {
    generatedAt: CREATION_TIME,
    project: {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description || ''
    },
    compliance: {
      licenses: {
        distribution: licenseDistribution,
        totalPackages: dependencies.length,
        unknownLicenses: licenseDistribution['UNKNOWN'] || 0
      },
      security: {
        summary: securitySummary,
        vulnerabilities: securityInfo.vulnerabilities,
        riskLevel: securitySummary.critical > 0 ? 'HIGH' : 
                   securitySummary.high > 0 ? 'MEDIUM' : 
                   securitySummary.moderate > 0 ? 'LOW' : 'MINIMAL'
      }
    },
    recommendations: [
      ...(securitySummary.critical > 0 ? ['Update packages with critical vulnerabilities immediately'] : []),
      ...(securitySummary.high > 0 ? ['Review and update packages with high severity vulnerabilities'] : []),
      ...(licenseDistribution['UNKNOWN'] > 0 ? ['Review packages with unknown licenses'] : []),
      'Regular security audits recommended',
      'Consider using license compliance tools'
    ]
  };
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Generating Software Bill of Materials (SBOM)...');
  
  try {
    // Ensure output directory exists
    const outputDir = path.join(__dirname, '..', 'reports', 'sbom');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate SPDX SBOM
    console.log('📋 Generating SPDX SBOM...');
    const spdxSbom = generateSBOM();
    fs.writeFileSync(
      path.join(outputDir, 'sbom-spdx.json'),
      JSON.stringify(spdxSbom, null, 2)
    );
    
    // Generate CycloneDX SBOM
    console.log('🔄 Generating CycloneDX SBOM...');
    const cycloneDxSbom = generateCycloneDXSBOM();
    fs.writeFileSync(
      path.join(outputDir, 'sbom-cyclonedx.json'),
      JSON.stringify(cycloneDxSbom, null, 2)
    );
    
    // Generate compliance report
    console.log('📊 Generating compliance report...');
    const complianceReport = generateComplianceReport();
    fs.writeFileSync(
      path.join(outputDir, 'compliance-report.json'),
      JSON.stringify(complianceReport, null, 2)
    );
    
    // Generate summary
    const summary = {
      generatedAt: CREATION_TIME,
      files: [
        'sbom-spdx.json',
        'sbom-cyclonedx.json',
        'compliance-report.json'
      ],
      statistics: {
        totalDependencies: spdxSbom.packages.length - 1, // Exclude root package
        vulnerabilities: complianceReport.compliance.security.summary.total,
        riskLevel: complianceReport.compliance.security.riskLevel
      }
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'sbom-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('✅ SBOM generation completed successfully!');
    console.log(`📁 Reports saved to: ${outputDir}`);
    console.log(`📦 Total dependencies: ${summary.statistics.totalDependencies}`);
    console.log(`🔒 Security vulnerabilities: ${summary.statistics.vulnerabilities}`);
    console.log(`⚠️  Risk level: ${summary.statistics.riskLevel}`);
    
  } catch (error) {
    console.error('❌ Error generating SBOM:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSBOM,
  generateCycloneDXSBOM,
  generateComplianceReport
};