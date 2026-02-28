/**
 * Purpose: Analyze UI component code for quality, best practices, and patterns
 * Input: Component file paths or directory paths via command line arguments
 * Output: JSON report with analysis results, issues, and recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function analyzeComponent(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(filePath);
        const fileName = path.basename(filePath);
        
        const analysis = {
            file: fileName,
            path: filePath,
            type: getComponentType(ext, content),
            size: content.length,
            lines: content.split('\n').length,
            issues: [],
            recommendations: [],
            metrics: {},
            patterns: []
        };

        // Analyze component structure
        analyzeStructure(content, analysis);
        
        // Check accessibility
        analyzeAccessibility(content, analysis);
        
        // Performance analysis
        analyzePerformance(content, analysis);
        
        // Code quality checks
        analyzeCodeQuality(content, analysis);
        
        // Design patterns
        analyzePatterns(content, analysis);
        
        return analysis;
    } catch (error) {
        return {
            file: path.basename(filePath),
            path: filePath,
            error: error.message,
            issues: [{ type: 'error', message: `Failed to analyze: ${error.message}` }]
        };
    }
}

function getComponentType(ext, content) {
    if (ext === '.vue') return 'Vue';
    if (ext === '.svelte') return 'Svelte';
    if (content.includes('React') || content.includes('jsx') || content.includes('useState')) return 'React';
    if (content.includes('Angular') || content.includes('@Component')) return 'Angular';
    if (ext === '.js' || ext === '.ts') return 'JavaScript/TypeScript';
    return 'Unknown';
}

function analyzeStructure(content, analysis) {
    const lines = content.split('\n');
    
    // Component size analysis
    analysis.metrics.componentSize = lines.length;
    if (lines.length > 500) {
        analysis.issues.push({
            type: 'warning',
            category: 'structure',
            message: 'Component is very large (>500 lines). Consider splitting into smaller components.'
        });
    }
    
    // Function/method count
    const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || [];
    analysis.metrics.functionCount = functionMatches.length;
    
    if (functionMatches.length > 15) {
        analysis.issues.push({
            type: 'warning',
            category: 'structure',
            message: 'High number of functions/methods. Consider refactoring for better maintainability.'
        });
    }
    
    // Nesting depth analysis
    const maxNesting = getMaxNestingDepth(content);
    analysis.metrics.maxNestingDepth = maxNesting;
    
    if (maxNesting > 5) {
        analysis.issues.push({
            type: 'warning',
            category: 'structure',
            message: 'Deep nesting detected. Consider flattening the structure.'
        });
    }
}

function analyzeAccessibility(content, analysis) {
    const a11yIssues = [];
    
    // Check for missing alt text
    if (content.includes('<img') && !content.includes('alt=')) {
        a11yIssues.push('Missing alt attributes on images');
    }
    
    // Check for semantic HTML
    const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
    const hasSemanticTags = semanticTags.some(tag => content.includes(`<${tag}`));
    
    if (!hasSemanticTags && content.includes('<div')) {
        a11yIssues.push('Consider using semantic HTML elements instead of generic divs');
    }
    
    // Check for ARIA labels
    if (content.includes('button') && !content.includes('aria-label') && !content.includes('aria-labelledby')) {
        a11yIssues.push('Interactive elements may need ARIA labels for screen readers');
    }
    
    // Check for focus management
    if (content.includes('modal') || content.includes('dialog')) {
        if (!content.includes('focus') && !content.includes('tabindex')) {
            a11yIssues.push('Modal/dialog components should manage focus properly');
        }
    }
    
    analysis.metrics.accessibilityScore = Math.max(0, 10 - a11yIssues.length * 2);
    a11yIssues.forEach(issue => {
        analysis.issues.push({
            type: 'warning',
            category: 'accessibility',
            message: issue
        });
    });
}

function analyzePerformance(content, analysis) {
    const perfIssues = [];
    
    // Check for unnecessary re-renders (React)
    if (content.includes('useState') || content.includes('useEffect')) {
        if (!content.includes('useMemo') && !content.includes('useCallback')) {
            perfIssues.push('Consider using useMemo/useCallback for optimization');
        }
    }
    
    // Check for inline functions in JSX
    if (content.match(/onClick=\{[^}]*=>/g)) {
        perfIssues.push('Inline arrow functions in event handlers may cause unnecessary re-renders');
    }
    
    // Large inline styles or objects
    const inlineObjects = content.match(/style=\{[^}]{50,}\}/g) || [];
    if (inlineObjects.length > 0) {
        perfIssues.push('Large inline style objects detected. Consider extracting to constants.');
    }
    
    // Check for missing key props in lists
    if (content.includes('.map(') && !content.includes('key=')) {
        perfIssues.push('Missing key props in list rendering');
    }
    
    analysis.metrics.performanceScore = Math.max(0, 10 - perfIssues.length * 2);
    perfIssues.forEach(issue => {
        analysis.issues.push({
            type: 'info',
            category: 'performance',
            message: issue
        });
    });
}

function analyzeCodeQuality(content, analysis) {
    const qualityIssues = [];
    
    // Check for TODO/FIXME comments
    const todoMatches = content.match(/TODO|FIXME|XXX/gi) || [];
    if (todoMatches.length > 0) {
        qualityIssues.push(`${todoMatches.length} TODO/FIXME comments found`);
    }
    
    // Check for console.log statements
    const consoleMatches = content.match(/console\.(log|warn|error)/g) || [];
    if (consoleMatches.length > 0) {
        qualityIssues.push(`${consoleMatches.length} console statements found (should be removed for production)`);
    }
    
    // Check for proper error handling
    if (content.includes('try') && !content.includes('catch')) {
        qualityIssues.push('Try blocks without catch statements detected');
    }
    
    // Check for magic numbers
    const numberMatches = content.match(/\b\d{2,}\b/g) || [];
    if (numberMatches.length > 3) {
        qualityIssues.push('Multiple magic numbers detected. Consider using named constants.');
    }
    
    analysis.metrics.codeQualityScore = Math.max(0, 10 - qualityIssues.length * 1.5);
    qualityIssues.forEach(issue => {
        analysis.issues.push({
            type: 'info',
            category: 'code-quality',
            message: issue
        });
    });
}

function analyzePatterns(content, analysis) {
    const patterns = [];
    
    // Design patterns detection
    if (content.includes('createContext') || content.includes('useContext')) {
        patterns.push('Context Pattern');
    }
    
    if (content.includes('render props') || content.match(/\(\s*\{[^}]*\}\s*\)\s*=>/)) {
        patterns.push('Render Props Pattern');
    }
    
    if (content.includes('HOC') || content.includes('withComponent')) {
        patterns.push('Higher-Order Component');
    }
    
    if (content.includes('useState') && content.includes('useEffect')) {
        patterns.push('Hooks Pattern');
    }
    
    if (content.includes('children')) {
        patterns.push('Composition Pattern');
    }
    
    analysis.patterns = patterns;
    
    // Recommendations based on patterns
    if (patterns.length === 0) {
        analysis.recommendations.push('Consider implementing established design patterns for better maintainability');
    }
    
    if (patterns.includes('Higher-Order Component') && content.includes('useState')) {
        analysis.recommendations.push('Consider migrating from HOCs to Hooks for better performance');
    }
}

function getMaxNestingDepth(content) {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (let i = 0; i < content.length; i++) {
        if (content[i] === '{' || content[i] === '(') {
            currentDepth++;
            maxDepth = Math.max(maxDepth, currentDepth);
        } else if (content[i] === '}' || content[i] === ')') {
            currentDepth--;
        }
    }
    
    return maxDepth;
}

function generateRecommendations(analysis) {
    if (analysis.metrics.accessibilityScore < 8) {
        analysis.recommendations.push('Improve accessibility by adding proper ARIA labels and semantic HTML');
    }
    
    if (analysis.metrics.performanceScore < 7) {
        analysis.recommendations.push('Optimize performance by implementing memoization and avoiding inline functions');
    }
    
    if (analysis.metrics.componentSize > 300) {
        analysis.recommendations.push('Consider breaking down this component into smaller, more focused components');
    }
    
    if (analysis.patterns.length > 3) {
        analysis.recommendations.push('Component uses multiple patterns. Ensure consistency and avoid over-engineering');
    }
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('Usage: node analyze-component.js <file-or-directory-paths...>');
        process.exit(1);
    }
    
    const results = [];
    
    try {
        for (const arg of args) {
            const stats = fs.statSync(arg);
            
            if (stats.isDirectory()) {
                const files = fs.readdirSync(arg)
                    .filter(file => /\.(js|jsx|ts|tsx|vue|svelte)$/.test(file))
                    .map(file => path.join(arg, file));
                
                for (const file of files) {
                    const analysis = analyzeComponent(file);
                    generateRecommendations(analysis);
                    results.push(analysis);
                }
            } else {
                const analysis = analyzeComponent(arg);
                generateRecommendations(analysis);
                results.push(analysis);
            }
        }
        
        const summary = {
            totalComponents: results.length,
            avgMetrics: calculateAverageMetrics(results),
            commonIssues: getCommonIssues(results),
            overallRecommendations: getOverallRecommendations(results)
        };
        
        const output = {
            summary,
            components: results,
            timestamp: new Date().toISOString()
        };
        
        console.log(JSON.stringify(output, null, 2));
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

function calculateAverageMetrics(results) {
    const validResults = results.filter(r => !r.error);
    if (validResults.length === 0) return {};
    
    const totals = validResults.reduce((acc, result) => {
        Object.keys(result.metrics).forEach(key => {
            acc[key] = (acc[key] || 0) + result.metrics[key];
        });
        return acc;
    }, {});
    
    const averages = {};
    Object.keys(totals).forEach(key => {
        averages[key] = Math.round((totals[key] / validResults.length) * 100) / 100;
    });
    
    return averages;
}

function getCommonIssues(results) {
    const issueMap = {};
    
    results.forEach(result => {
        if (result.issues) {
            result.issues.forEach(issue => {
                const key = `${issue.category}: ${issue.message}`;
                issueMap[key] = (issueMap[key] || 0) + 1;
            });
        }
    });
    
    return Object.entries(issueMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue, count]) => ({ issue, count }));
}

function getOverallRecommendations(results) {
    const recommendations = [];
    const avgMetrics = calculateAverageMetrics(results);
    
    if (avgMetrics.accessibilityScore < 7) {
        recommendations.push('Focus on improving accessibility across components');
    }
    
    if (avgMetrics.componentSize > 250) {
        recommendations.push('Consider establishing component size guidelines');
    }
    
    if (avgMetrics.performanceScore < 8) {
        recommendations.push('Implement performance optimization patterns consistently');
    }
    
    return recommendations;
}

if (require.main === module) {
    main();
}