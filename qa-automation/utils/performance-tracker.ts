/**
 * CuisineZen Performance Tracking System
 * Advanced performance monitoring for test automation
 */

export interface PerformanceMetrics {
  testName: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  renderMetrics?: {
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    totalBlockingTime: number;
  };
  networkMetrics?: {
    requests: number;
    totalSize: number;
    averageResponseTime: number;
  };
  domMetrics?: {
    nodes: number;
    depth: number;
    listeners: number;
  };
  customMetrics?: Record<string, number>;
}

export interface PerformanceThresholds {
  maxDuration: number;
  maxMemoryUsage: number;
  maxRenderTime: number;
  maxNetworkRequests: number;
  maxDOMNodes: number;
}

export class PerformanceTracker {
  private activeTests: Map<string, { startTime: number; data: any }> = new Map();
  private completedTests: PerformanceMetrics[] = [];
  private observer?: PerformanceObserver;
  private isTracking = false;
  
  private defaultThresholds: PerformanceThresholds = {
    maxDuration: 5000, // 5 seconds
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxRenderTime: 100, // 100ms
    maxNetworkRequests: 10,
    maxDOMNodes: 1000,
  };

  constructor(private customThresholds?: Partial<PerformanceThresholds>) {
    if (customThresholds) {
      this.defaultThresholds = { ...this.defaultThresholds, ...customThresholds };
    }
  }

  startTracking(): void {
    if (this.isTracking) return;

    console.log('📊 Starting performance tracking...');
    this.isTracking = true;
    this.setupPerformanceObserver();
    this.setupMemoryMonitoring();
  }

  stopTracking(): void {
    if (!this.isTracking) return;

    console.log('📊 Stopping performance tracking...');
    this.isTracking = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }

  startTest(testName: string): void {
    if (!this.isTracking) {
      console.warn('Performance tracking not started. Call startTracking() first.');
      return;
    }

    const startTime = performance.now();
    this.activeTests.set(testName, {
      startTime,
      data: {
        networkRequests: 0,
        domMutations: 0,
        customMetrics: {},
      },
    });

    // Mark the test start for Performance Timeline API
    performance.mark(`test-start-${testName}`);
  }

  endTest(testName: string): PerformanceMetrics {
    const testData = this.activeTests.get(testName);
    if (!testData) {
      throw new Error(`Test '${testName}' was not started or already ended`);
    }

    const endTime = performance.now();
    const duration = endTime - testData.startTime;

    // Mark the test end for Performance Timeline API
    performance.mark(`test-end-${testName}`);
    performance.measure(testName, `test-start-${testName}`, `test-end-${testName}`);

    const metrics: PerformanceMetrics = {
      testName,
      startTime: testData.startTime,
      endTime,
      duration,
      memoryUsage: this.getMemoryUsage(),
      renderMetrics: this.getRenderMetrics(testName),
      networkMetrics: this.getNetworkMetrics(testName),
      domMetrics: this.getDOMMetrics(),
      customMetrics: testData.data.customMetrics,
    };

    this.completedTests.push(metrics);
    this.activeTests.delete(testName);

    // Validate against thresholds
    this.validatePerformance(metrics);

    return metrics;
  }

  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('PerformanceObserver not available in this environment');
      return;
    }

    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        // Track navigation and resource timing
        if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
          this.processTimingEntry(entry);
        }
        
        // Track paint timing
        if (entry.entryType === 'paint') {
          this.processPaintEntry(entry);
        }
        
        // Track largest contentful paint
        if (entry.entryType === 'largest-contentful-paint') {
          this.processLCPEntry(entry);
        }
        
        // Track layout shift
        if (entry.entryType === 'layout-shift') {
          this.processLayoutShiftEntry(entry);
        }
      });
    });

    try {
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'layout-shift'] });
    } catch (error) {
      console.warn('Some performance entry types not supported:', error);
      // Fallback to basic types
      try {
        this.observer.observe({ entryTypes: ['navigation', 'resource'] });
      } catch (fallbackError) {
        console.warn('Performance observation failed:', fallbackError);
      }
    }
  }

  private setupMemoryMonitoring(): void {
    // Monitor memory usage periodically
    if (typeof (performance as any).memory !== 'undefined') {
      setInterval(() => {
        const memory = this.getMemoryUsage();
        if (memory.percentage > 80) {
          console.warn(`High memory usage detected: ${memory.percentage.toFixed(1)}%`);
        }
      }, 1000);
    }
  }

  private getMemoryUsage(): PerformanceMetrics['memoryUsage'] {
    if (typeof (performance as any).memory !== 'undefined') {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }
    
    // Fallback for environments without memory API
    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }

  private getRenderMetrics(testName: string): PerformanceMetrics['renderMetrics'] {
    const paintEntries = performance.getEntriesByType('paint');
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const layoutShiftEntries = performance.getEntriesByType('layout-shift');

    return {
      firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
      largestContentfulPaint: lcpEntries[lcpEntries.length - 1]?.startTime || 0,
      cumulativeLayoutShift: layoutShiftEntries.reduce((sum, entry) => {
        return sum + (entry as any).value;
      }, 0),
      totalBlockingTime: this.calculateTotalBlockingTime(),
    };
  }

  private getNetworkMetrics(testName: string): PerformanceMetrics['networkMetrics'] {
    const resourceEntries = performance.getEntriesByType('resource');
    
    if (resourceEntries.length === 0) {
      return {
        requests: 0,
        totalSize: 0,
        averageResponseTime: 0,
      };
    }

    const totalSize = resourceEntries.reduce((sum, entry) => {
      return sum + ((entry as any).transferSize || 0);
    }, 0);

    const totalDuration = resourceEntries.reduce((sum, entry) => {
      return sum + entry.duration;
    }, 0);

    return {
      requests: resourceEntries.length,
      totalSize,
      averageResponseTime: totalDuration / resourceEntries.length,
    };
  }

  private getDOMMetrics(): PerformanceMetrics['domMetrics'] {
    if (typeof document === 'undefined') {
      return {
        nodes: 0,
        depth: 0,
        listeners: 0,
      };
    }

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    let nodeCount = 0;
    let maxDepth = 0;
    let currentDepth = 0;

    while (walker.nextNode()) {
      nodeCount++;
      
      // Calculate depth (simplified)
      const element = walker.currentNode as Element;
      const depth = element.tagName.split('/').length;
      maxDepth = Math.max(maxDepth, depth);
    }

    return {
      nodes: nodeCount,
      depth: maxDepth,
      listeners: this.countEventListeners(),
    };
  }

  private countEventListeners(): number {
    // This is a simplified implementation
    // In a real scenario, you might use getEventListeners() in Chrome DevTools
    if (typeof document === 'undefined') return 0;
    
    const allElements = document.querySelectorAll('*');
    let listenerCount = 0;
    
    allElements.forEach(element => {
      // Check for common event attributes
      const eventAttributes = ['onclick', 'onchange', 'onsubmit', 'onload', 'onerror'];
      eventAttributes.forEach(attr => {
        if (element.hasAttribute(attr)) {
          listenerCount++;
        }
      });
    });
    
    return listenerCount;
  }

  private calculateTotalBlockingTime(): number {
    // Simplified TBT calculation
    const longTaskEntries = performance.getEntriesByType('longtask');
    return longTaskEntries.reduce((tbt, entry) => {
      const blockingTime = Math.max(0, entry.duration - 50);
      return tbt + blockingTime;
    }, 0);
  }

  private processTimingEntry(entry: PerformanceEntry): void {
    // Process navigation and resource timing entries
    console.debug('Timing entry:', entry.name, entry.duration);
  }

  private processPaintEntry(entry: PerformanceEntry): void {
    console.debug('Paint entry:', entry.name, entry.startTime);
  }

  private processLCPEntry(entry: PerformanceEntry): void {
    console.debug('LCP entry:', entry.startTime);
  }

  private processLayoutShiftEntry(entry: PerformanceEntry): void {
    const value = (entry as any).value;
    if (value > 0.1) {
      console.warn('Significant layout shift detected:', value);
    }
  }

  private validatePerformance(metrics: PerformanceMetrics): void {
    const violations: string[] = [];

    if (metrics.duration > this.defaultThresholds.maxDuration) {
      violations.push(`Test duration ${metrics.duration}ms exceeds threshold ${this.defaultThresholds.maxDuration}ms`);
    }

    if (metrics.memoryUsage.used > this.defaultThresholds.maxMemoryUsage) {
      violations.push(`Memory usage ${metrics.memoryUsage.used} bytes exceeds threshold ${this.defaultThresholds.maxMemoryUsage} bytes`);
    }

    if (metrics.renderMetrics?.largestContentfulPaint && 
        metrics.renderMetrics.largestContentfulPaint > this.defaultThresholds.maxRenderTime) {
      violations.push(`LCP ${metrics.renderMetrics.largestContentfulPaint}ms exceeds threshold ${this.defaultThresholds.maxRenderTime}ms`);
    }

    if (metrics.networkMetrics?.requests && 
        metrics.networkMetrics.requests > this.defaultThresholds.maxNetworkRequests) {
      violations.push(`Network requests ${metrics.networkMetrics.requests} exceed threshold ${this.defaultThresholds.maxNetworkRequests}`);
    }

    if (metrics.domMetrics?.nodes && 
        metrics.domMetrics.nodes > this.defaultThresholds.maxDOMNodes) {
      violations.push(`DOM nodes ${metrics.domMetrics.nodes} exceed threshold ${this.defaultThresholds.maxDOMNodes}`);
    }

    if (violations.length > 0) {
      console.warn(`Performance violations in test '${metrics.testName}':`, violations);
    }
  }

  // Custom metrics API
  addCustomMetric(testName: string, metricName: string, value: number): void {
    const testData = this.activeTests.get(testName);
    if (testData) {
      testData.data.customMetrics[metricName] = value;
    }
  }

  // Reporting methods
  getTestResults(): PerformanceMetrics[] {
    return [...this.completedTests];
  }

  generatePerformanceReport(): string {
    const report = {
      summary: {
        totalTests: this.completedTests.length,
        averageDuration: this.completedTests.reduce((sum, test) => sum + test.duration, 0) / this.completedTests.length || 0,
        slowestTest: this.completedTests.reduce((slowest, test) => 
          test.duration > (slowest?.duration || 0) ? test : slowest, null
        ),
        memoryPeakUsage: Math.max(...this.completedTests.map(test => test.memoryUsage.used)),
      },
      details: this.completedTests,
      thresholds: this.defaultThresholds,
    };

    return JSON.stringify(report, null, 2);
  }

  clearHistory(): void {
    this.completedTests = [];
    performance.clearMarks();
    performance.clearMeasures();
  }

  // Utility methods for test scenarios
  measureRenderTime<T>(fn: () => T): { result: T; renderTime: number } {
    const startTime = performance.now();
    const result = fn();
    const renderTime = performance.now() - startTime;
    
    return { result, renderTime };
  }

  async measureAsyncOperation<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;
    
    return { result, duration };
  }
}