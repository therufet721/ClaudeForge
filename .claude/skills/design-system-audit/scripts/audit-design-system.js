/**
 * Purpose: Evaluates design system implementation and consistency across the codebase
 * Input: File paths to analyze (CSS, SCSS, JS, JSX, TS, TSX files)
 * Output: JSON report with design system audit results
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

function parseArguments() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: node audit-design-system.js <paths...>');
        process.exit(1);
    }
    return args;
}

function findDesignTokens(content) {
    const tokens = {
        colors: [],
        spacing: [],
        typography: [],
        breakpoints: [],
        shadows: []
    };

    // CSS custom properties
    const customProps = content.match(/--[\w-]+:\s*[^;]+/g) || [];
    customProps.forEach(prop => {
        const [name, value] = prop.split(':').map(s => s.trim());
        if (name.includes('color')) tokens.colors.push({ name, value });
        else if (name.includes('space') || name.includes('gap') || name.includes('margin') || name.includes('padding')) {
            tokens.spacing.push({ name, value });
        }
        else if (name.includes('font') || name.includes('text')) tokens.typography.push({ name, value });
        else if (name.includes('shadow')) tokens.shadows.push({ name, value });
        else if (name.includes('breakpoint')) tokens.breakpoints.push({ name, value });
    });

    // SCSS variables
    const scssVars = content.match(/\$[\w-]+:\s*[^;]+/g) || [];
    scssVars.forEach(variable => {
        const [name, value] = variable.split(':').map(s => s.trim());
        if (name.includes('color')) tokens.colors.push({ name, value });
        else if (name.includes('space') || name.includes('gap') || name.includes('margin') || name.includes('padding')) {
            tokens.spacing.push({ name, value });
        }
        else if (name.includes('font') || name.includes('text')) tokens.typography.push({ name, value });
        else if (name.includes('shadow')) tokens.shadows.push({ name, value });
        else if (name.includes('breakpoint')) tokens.breakpoints.push({ name, value });
    });

    return tokens;
}

function findHardcodedValues(content) {
    const issues = [];
    
    // Hardcoded colors (hex, rgb, rgba)
    const colorRegex = /#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)/g;
    const colorMatches = content.match(colorRegex) || [];
    colorMatches.forEach(match => {
        issues.push({
            type: 'hardcoded-color',
            value: match,
            severity: 'medium',
            suggestion: 'Use design token instead'
        });
    });

    // Hardcoded pixel values
    const pixelRegex = /\b\d+px\b/g;
    const pixelMatches = content.match(pixelRegex) || [];
    pixelMatches.forEach(match => {
        const value = parseInt(match);
        if (value > 0 && value !== 1) { // Allow 1px borders
            issues.push({
                type: 'hardcoded-spacing',
                value: match,
                severity: 'low',
                suggestion: 'Consider using spacing token'
            });
        }
    });

    return issues;
}

function analyzeComponentConsistency(content, filePath) {
    const issues = [];
    const fileExtension = path.extname(filePath);

    if (['.jsx', '.tsx', '.js', '.ts'].includes(fileExtension)) {
        // Check for styled-components or emotion usage
        const styledUsage = content.match(/styled\.\w+|css`/g);
        if (styledUsage) {
            issues.push({
                type: 'inline-styles',
                count: styledUsage.length,
                severity: 'low',
                suggestion: 'Consider extracting to design system components'
            });
        }

        // Check for className patterns that might indicate inconsistency
        const classNames = content.match(/className=["']([^"']+)["']/g) || [];
        const utilityClasses = classNames.filter(cls => 
            cls.includes('m-') || cls.includes('p-') || cls.includes('text-') || cls.includes('bg-')
        );
        
        if (utilityClasses.length > 10) {
            issues.push({
                type: 'excessive-utility-classes',
                count: utilityClasses.length,
                severity: 'medium',
                suggestion: 'Consider creating reusable components'
            });
        }
    }

    return issues;
}

function calculateConsistencyScore(tokens, issues) {
    let score = 100;
    
    // Deduct points for hardcoded values
    const hardcodedIssues = issues.filter(issue => 
        issue.type === 'hardcoded-color' || issue.type === 'hardcoded-spacing'
    );
    score -= hardcodedIssues.length * 2;

    // Deduct points for inconsistent patterns
    const consistencyIssues = issues.filter(issue => 
        issue.type === 'inline-styles' || issue.type === 'excessive-utility-classes'
    );
    score -= consistencyIssues.length * 5;

    // Bonus for token usage
    const totalTokens = Object.values(tokens).reduce((sum, arr) => sum + arr.length, 0);
    score += Math.min(totalTokens * 2, 20);

    return Math.max(0, Math.min(100, score));
}

async function auditFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const tokens = findDesignTokens(content);
        const hardcodedIssues = findHardcodedValues(content);
        const consistencyIssues = analyzeComponentConsistency(content, filePath);
        
        const allIssues = [...hardcodedIssues, ...consistencyIssues];
        const consistencyScore = calculateConsistencyScore(tokens, allIssues);

        return {
            file: filePath,
            tokens,
            issues: allIssues,
            consistencyScore,
            linesOfCode: content.split('\n').length
        };
    } catch (error) {
        console.error(`Error processing ${filePath}: ${error.message}`, { file: 'stderr' });
        return null;
    }
}

async function main() {
    try {
        const paths = parseArguments();
        const allFiles = [];

        // Expand glob patterns and collect all files
        for (const pathPattern of paths) {
            if (fs.existsSync(pathPattern) && fs.statSync(pathPattern).isFile()) {
                allFiles.push(pathPattern);
            } else {
                const files = await glob(pathPattern, {
                    ignore: ['node_modules/**', 'dist/**', 'build/**']
                });
                allFiles.push(...files);
            }
        }

        const supportedExtensions = ['.css', '.scss', '.sass', '.js', '.jsx', '.ts', '.tsx'];
        const filteredFiles = allFiles.filter(file => 
            supportedExtensions.includes(path.extname(file))
        );

        if (filteredFiles.length === 0) {
            console.error('No supported files found');
            process.exit(1);
        }

        const results = [];
        for (const file of filteredFiles) {
            const result = await auditFile(file);
            if (result) {
                results.push(result);
            }
        }

        // Generate summary
        const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
        const averageScore = results.reduce((sum, r) => sum + r.consistencyScore, 0) / results.length;
        const totalTokens = results.reduce((sum, r) => 
            sum + Object.values(r.tokens).reduce((tSum, arr) => tSum + arr.length, 0), 0
        );

        const issuesByType = {};
        results.forEach(result => {
            result.issues.forEach(issue => {
                issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
            });
        });

        const report = {
            summary: {
                filesAnalyzed: results.length,
                totalIssues,
                averageConsistencyScore: Math.round(averageScore * 100) / 100,
                totalDesignTokens: totalTokens,
                issuesByType
            },
            files: results,
            recommendations: generateRecommendations(issuesByType, averageScore)
        };

        console.log(JSON.stringify(report, null, 2));
        
    } catch (error) {
        console.error(`Audit failed: ${error.message}`, { file: 'stderr' });
        process.exit(1);
    }
}

function generateRecommendations(issuesByType, averageScore) {
    const recommendations = [];

    if (issuesByType['hardcoded-color'] > 5) {
        recommendations.push({
            priority: 'high',
            category: 'design-tokens',
            message: 'Replace hardcoded colors with design tokens to improve consistency'
        });
    }

    if (issuesByType['hardcoded-spacing'] > 10) {
        recommendations.push({
            priority: 'medium',
            category: 'design-tokens',
            message: 'Consider using spacing tokens for better layout consistency'
        });
    }

    if (issuesByType['excessive-utility-classes'] > 3) {
        recommendations.push({
            priority: 'medium',
            category: 'component-architecture',
            message: 'Extract common patterns into reusable components'
        });
    }

    if (averageScore < 70) {
        recommendations.push({
            priority: 'high',
            category: 'overall',
            message: 'Design system consistency is below recommended threshold. Focus on token adoption and reducing hardcoded values'
        });
    }

    return recommendations;
}

if (require.main === module) {
    main().catch(error => {
        console.error(`Fatal error: ${error.message}`, { file: 'stderr' });
        process.exit(1);
    });
}