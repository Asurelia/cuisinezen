/**
 * Tests et validations pour les optimisations d'images
 * Utilitaires pour tester les performances en développement
 */

export interface ImageLoadTest {
  src: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  format?: string;
  size?: number;
}

/**
 * Teste le chargement d'une image et mesure les performances
 */
export async function testImageLoad(src: string): Promise<ImageLoadTest> {
  const test: ImageLoadTest = {
    src,
    startTime: performance.now(),
    success: false,
  };

  try {
    const img = new Image();
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        test.endTime = performance.now();
        test.duration = test.endTime - test.startTime;
        test.success = true;
        
        // Détection du format si possible
        if (src.includes('webp')) test.format = 'webp';
        else if (src.includes('avif')) test.format = 'avif';
        else if (src.includes('jpg') || src.includes('jpeg')) test.format = 'jpeg';
        else if (src.includes('png')) test.format = 'png';
        
        resolve();
      };
      
      img.onerror = () => {
        test.endTime = performance.now();
        test.duration = test.endTime - test.startTime;
        test.success = false;
        test.error = 'Failed to load image';
        reject(new Error(test.error));
      };
      
      img.src = src;
    });
    
  } catch (error) {
    test.error = error instanceof Error ? error.message : 'Unknown error';
    test.success = false;
  }

  return test;
}

/**
 * Teste le chargement de plusieurs images et génère un rapport
 */
export async function testBatchImageLoad(sources: string[]): Promise<{
  tests: ImageLoadTest[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    averageLoadTime: number;
    totalLoadTime: number;
    fastestLoad: number;
    slowestLoad: number;
  };
}> {
  const tests = await Promise.allSettled(
    sources.map(src => testImageLoad(src))
  );

  const results = tests.map(test => 
    test.status === 'fulfilled' ? test.value : {
      src: 'unknown',
      startTime: 0,
      success: false,
      error: 'Promise rejected'
    }
  );

  const successful = results.filter(r => r.success);
  const durations = successful
    .map(r => r.duration)
    .filter((d): d is number => d !== undefined);

  const summary = {
    total: results.length,
    successful: successful.length,
    failed: results.length - successful.length,
    averageLoadTime: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
    totalLoadTime: durations.reduce((a, b) => a + b, 0),
    fastestLoad: durations.length > 0 ? Math.min(...durations) : 0,
    slowestLoad: durations.length > 0 ? Math.max(...durations) : 0,
  };

  return { tests: results, summary };
}

/**
 * Teste la détection des formats d'images supportés
 */
export async function testFormatSupport(): Promise<{
  webp: boolean;
  avif: boolean;
  testDuration: number;
}> {
  const startTime = performance.now();
  
  // Test WebP
  const webpTest = new Promise<boolean>((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => resolve(webP.height === 2);
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });

  // Test AVIF
  const avifTest = new Promise<boolean>((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => resolve(avif.height === 2);
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });

  const [webp, avif] = await Promise.all([webpTest, avifTest]);
  const testDuration = performance.now() - startTime;

  return { webp, avif, testDuration };
}

/**
 * Mesure l'impact du lazy loading
 */
export class LazyLoadingMetrics {
  private observers: Map<string, {
    observer: IntersectionObserver;
    startTime: number;
    visible: boolean;
  }> = new Map();

  observeElement(element: HTMLElement, identifier: string): void {
    const startTime = performance.now();
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const data = this.observers.get(identifier);
            if (data && !data.visible) {
              const visibilityTime = performance.now() - data.startTime;
              console.log(`Lazy load trigger for ${identifier}: ${visibilityTime.toFixed(2)}ms`);
              
              // Marquer comme visible
              this.observers.set(identifier, {
                ...data,
                visible: true,
              });
              
              // Arrêter l'observation
              observer.disconnect();
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    observer.observe(element);
    
    this.observers.set(identifier, {
      observer,
      startTime,
      visible: false,
    });
  }

  getMetrics(): Array<{
    identifier: string;
    timeToVisibility?: number;
    isVisible: boolean;
  }> {
    return Array.from(this.observers.entries()).map(([identifier, data]) => ({
      identifier,
      timeToVisibility: data.visible ? performance.now() - data.startTime : undefined,
      isVisible: data.visible,
    }));
  }

  cleanup(): void {
    this.observers.forEach(({ observer }) => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * Tests de performance Core Web Vitals pour les images
 */
export class ImageCoreWebVitalsMonitor {
  private lcpObserver?: PerformanceObserver;
  private clsObserver?: PerformanceObserver;
  private metrics: {
    lcp?: number;
    cls?: number;
    imageElements: Set<string>;
  } = {
    imageElements: new Set(),
  };

  startMonitoring(): void {
    // Monitoring LCP
    if ('PerformanceObserver' in window) {
      try {
        this.lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
        });
        this.lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('LCP monitoring not available');
      }

      // Monitoring CLS
      try {
        this.clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            // Type guard pour LayoutShift
            if ('hadRecentInput' in entry && !(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.metrics.cls = clsValue;
        });
        this.clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('CLS monitoring not available');
      }
    }
  }

  registerImageElement(src: string): void {
    this.metrics.imageElements.add(src);
  }

  getMetrics(): {
    lcp?: number;
    cls?: number;
    imageCount: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    if (this.metrics.lcp && this.metrics.lcp > 2500) {
      recommendations.push('LCP supérieur à 2.5s - Optimiser les images critiques');
    }
    
    if (this.metrics.cls && this.metrics.cls > 0.1) {
      recommendations.push('CLS élevé - Vérifier les dimensions d\'images');
    }
    
    if (this.metrics.imageElements.size > 20) {
      recommendations.push('Beaucoup d\'images - Considérer plus de lazy loading');
    }

    return {
      lcp: this.metrics.lcp,
      cls: this.metrics.cls,
      imageCount: this.metrics.imageElements.size,
      recommendations,
    };
  }

  stopMonitoring(): void {
    this.lcpObserver?.disconnect();
    this.clsObserver?.disconnect();
  }
}

/**
 * Utilitaire pour tester les optimisations en développement
 */
export function runImageOptimizationTests(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Image optimization tests should only run in development');
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    console.group('🖼️ Image Optimization Tests');
    
    // Test de support des formats
    testFormatSupport().then((support) => {
      console.log('📊 Format Support:', support);
    });

    // Test Core Web Vitals
    const cwvMonitor = new ImageCoreWebVitalsMonitor();
    cwvMonitor.startMonitoring();
    
    setTimeout(() => {
      const metrics = cwvMonitor.getMetrics();
      console.log('📈 Core Web Vitals:', metrics);
      cwvMonitor.stopMonitoring();
      console.groupEnd();
      resolve();
    }, 3000);
  });
}

// Auto-exécution en développement si le module est importé
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runImageOptimizationTests, 1000);
    });
  } else {
    setTimeout(runImageOptimizationTests, 1000);
  }
}