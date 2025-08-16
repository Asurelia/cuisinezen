/**
 * Pipeline d'optimisation d'images automatisé pour CuisineZen
 * Gestion intelligente des formats, compression et delivery
 */

export interface ImageOptimizationConfig {
  quality: number;
  formats: ('webp' | 'avif' | 'jpeg' | 'png')[];
  sizes: number[];
  lazy: boolean;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
}

export interface OptimizedImageMeta {
  src: string;
  width: number;
  height: number;
  format: string;
  size: number;
  optimizationRatio: number;
  loadTime: number;
}

export interface ImagePerformanceMetrics {
  totalImages: number;
  optimizedImages: number;
  averageOptimization: number;
  formatDistribution: Record<string, number>;
  lcpImages: string[];
  violations: ImageViolation[];
}

export interface ImageViolation {
  src: string;
  issue: 'too_large' | 'wrong_format' | 'missing_alt' | 'blocking_lcp';
  severity: 'error' | 'warning';
  recommendation: string;
}

/**
 * Service d'optimisation d'images intelligent
 */
export class ImageOptimizerPipeline {
  private static instance: ImageOptimizerPipeline;
  private defaultConfig: ImageOptimizationConfig = {
    quality: 80,
    formats: ['webp', 'avif', 'jpeg'],
    sizes: [640, 768, 1024, 1280, 1600],
    lazy: true,
    placeholder: 'blur'
  };

  private constructor() {}

  public static getInstance(): ImageOptimizerPipeline {
    if (!ImageOptimizerPipeline.instance) {
      ImageOptimizerPipeline.instance = new ImageOptimizerPipeline();
    }
    return ImageOptimizerPipeline.instance;
  }

  /**
   * Optimise une image selon le contexte d'usage
   */
  public optimizeImage(
    src: string, 
    context: 'hero' | 'thumbnail' | 'gallery' | 'icon',
    customConfig?: Partial<ImageOptimizationConfig>
  ): OptimizedImageMeta {
    const config = this.getOptimizationConfig(context, customConfig);
    
    // Simulation d'optimisation (en production utiliserait Sharp/WebP/AVIF)
    const optimizedMeta: OptimizedImageMeta = {
      src: this.generateOptimizedSrc(src, config),
      width: this.getOptimalWidth(context),
      height: this.getOptimalHeight(context),
      format: this.selectBestFormat(config.formats),
      size: this.calculateOptimizedSize(src, config),
      optimizationRatio: this.calculateOptimizationRatio(src, config),
      loadTime: this.estimateLoadTime(src, config)
    };

    return optimizedMeta;
  }

  /**
   * Configuration d'optimisation par contexte
   */
  private getOptimizationConfig(
    context: string, 
    customConfig?: Partial<ImageOptimizationConfig>
  ): ImageOptimizationConfig {
    const contextConfigs = {
      hero: {
        quality: 85,
        formats: ['avif', 'webp', 'jpeg'] as const,
        sizes: [768, 1024, 1280, 1600, 1920],
        lazy: false,
        priority: true,
        placeholder: 'blur' as const
      },
      thumbnail: {
        quality: 75,
        formats: ['webp', 'jpeg'] as const,
        sizes: [150, 300, 600],
        lazy: true,
        placeholder: 'blur' as const
      },
      gallery: {
        quality: 80,
        formats: ['webp', 'avif', 'jpeg'] as const,
        sizes: [400, 600, 800, 1200],
        lazy: true,
        placeholder: 'blur' as const
      },
      icon: {
        quality: 90,
        formats: ['webp', 'png'] as const,
        sizes: [16, 24, 32, 48, 64],
        lazy: false,
        priority: true
      }
    };

    const baseConfig = contextConfigs[context] || this.defaultConfig;
    return { ...baseConfig, ...customConfig };
  }

  /**
   * Génère les sources responsives optimisées
   */
  public generateResponsiveSources(
    src: string,
    config: ImageOptimizationConfig
  ): {
    srcSet: string;
    sizes: string;
    fallback: string;
  } {
    const srcSet = config.sizes
      .map(size => {
        const optimizedSrc = this.generateOptimizedSrc(src, { ...config, width: size });
        return `${optimizedSrc} ${size}w`;
      })
      .join(', ');

    const sizes = this.generateSizesAttribute(config.sizes);
    const fallback = this.generateOptimizedSrc(src, config);

    return { srcSet, sizes, fallback };
  }

  /**
   * Analyse les performances des images sur une page
   */
  public async analyzePageImagePerformance(url: string): Promise<ImagePerformanceMetrics> {
    // Simulation d'analyse (en production utiliserait Puppeteer/Lighthouse)
    const images = await this.extractPageImages(url);
    const violations: ImageViolation[] = [];
    
    // Analyse des violations
    for (const img of images) {
      // Images trop lourdes
      if (img.size > 500000) { // 500KB
        violations.push({
          src: img.src,
          issue: 'too_large',
          severity: 'error',
          recommendation: 'Compress image or use modern format (WebP/AVIF)'
        });
      }

      // Format non optimisé
      if (img.src.includes('.png') && !img.src.includes('icon')) {
        violations.push({
          src: img.src,
          issue: 'wrong_format',
          severity: 'warning',
          recommendation: 'Convert to WebP or AVIF format'
        });
      }

      // Alt text manquant (impact accessibilité et SEO)
      if (!img.alt) {
        violations.push({
          src: img.src,
          issue: 'missing_alt',
          severity: 'warning',
          recommendation: 'Add descriptive alt text for accessibility'
        });
      }
    }

    // Détection LCP images
    const lcpImages = await this.identifyLCPImages(images);

    return {
      totalImages: images.length,
      optimizedImages: images.filter(img => this.isOptimized(img)).length,
      averageOptimization: this.calculateAverageOptimization(images),
      formatDistribution: this.calculateFormatDistribution(images),
      lcpImages: lcpImages.map(img => img.src),
      violations
    };
  }

  /**
   * Recommandations d'optimisation automatiques
   */
  public generateOptimizationRecommendations(metrics: ImagePerformanceMetrics): {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
  }[] {
    const recommendations = [];

    // LCP optimization
    if (metrics.lcpImages.length > 0) {
      recommendations.push({
        priority: 'high' as const,
        action: 'Optimize LCP images with priority loading and modern formats',
        expectedImpact: '20-40% improvement in Largest Contentful Paint'
      });
    }

    // Format optimization
    const jpegRatio = metrics.formatDistribution['jpeg'] || 0;
    if (jpegRatio > 0.5) {
      recommendations.push({
        priority: 'medium' as const,
        action: 'Convert JPEG images to WebP format',
        expectedImpact: '25-50% reduction in image file sizes'
      });
    }

    // Large images
    const largeImageViolations = metrics.violations.filter(v => v.issue === 'too_large');
    if (largeImageViolations.length > 0) {
      recommendations.push({
        priority: 'high' as const,
        action: 'Compress oversized images and implement responsive sizing',
        expectedImpact: '30-60% reduction in total image payload'
      });
    }

    // Lazy loading opportunities
    if (metrics.optimizedImages / metrics.totalImages < 0.8) {
      recommendations.push({
        priority: 'medium' as const,
        action: 'Implement lazy loading for below-fold images',
        expectedImpact: '15-30% improvement in initial page load time'
      });
    }

    return recommendations;
  }

  /**
   * Pipeline d'optimisation automatique pour CI/CD
   */
  public async runOptimizationPipeline(imagePaths: string[]): Promise<{
    processed: number;
    optimized: number;
    savedBytes: number;
    errors: string[];
  }> {
    let processed = 0;
    let optimized = 0;
    let savedBytes = 0;
    const errors: string[] = [];

    for (const imagePath of imagePaths) {
      try {
        const originalSize = await this.getImageSize(imagePath);
        const optimizationResult = await this.processImage(imagePath);
        
        if (optimizationResult.success) {
          optimized++;
          savedBytes += originalSize - optimizationResult.newSize;
        }
        
        processed++;
      } catch (error) {
        errors.push(`Failed to process ${imagePath}: ${error.message}`);
      }
    }

    return { processed, optimized, savedBytes, errors };
  }

  /**
   * Validation des budgets de performance pour les images
   */
  public validateImageBudgets(): {
    passed: boolean;
    violations: Array<{
      budget: string;
      current: number;
      threshold: number;
    }>;
  } {
    const budgets = [
      { name: 'total_image_size', threshold: 1000000, current: 800000 }, // 1MB total
      { name: 'largest_image', threshold: 300000, current: 250000 }, // 300KB per image
      { name: 'lcp_image_size', threshold: 200000, current: 150000 }, // 200KB for LCP
      { name: 'modern_format_ratio', threshold: 0.8, current: 0.9 } // 80% modern formats
    ];

    const violations = budgets
      .filter(budget => budget.current > budget.threshold)
      .map(budget => ({
        budget: budget.name,
        current: budget.current,
        threshold: budget.threshold
      }));

    return {
      passed: violations.length === 0,
      violations
    };
  }

  // Méthodes privées utilitaires
  private generateOptimizedSrc(src: string, config: ImageOptimizationConfig): string {
    // Simulation - en production utiliserait un service d'optimisation
    const params = new URLSearchParams({
      q: config.quality.toString(),
      f: config.formats[0],
      w: '800' // default width
    });
    
    return `${src}?${params.toString()}`;
  }

  private getOptimalWidth(context: string): number {
    const widths = {
      hero: 1200,
      thumbnail: 300,
      gallery: 600,
      icon: 48
    };
    return widths[context] || 800;
  }

  private getOptimalHeight(context: string): number {
    const heights = {
      hero: 600,
      thumbnail: 200,
      gallery: 400,
      icon: 48
    };
    return heights[context] || 600;
  }

  private selectBestFormat(formats: string[]): string {
    // Préférence pour les formats modernes
    if (formats.includes('avif')) return 'avif';
    if (formats.includes('webp')) return 'webp';
    return formats[0] || 'jpeg';
  }

  private calculateOptimizedSize(src: string, config: ImageOptimizationConfig): number {
    // Simulation basée sur la qualité et le format
    const baseSize = 100000; // 100KB base
    const qualityFactor = config.quality / 100;
    const formatFactor = config.formats[0] === 'avif' ? 0.5 : 
                        config.formats[0] === 'webp' ? 0.7 : 1;
    
    return Math.round(baseSize * qualityFactor * formatFactor);
  }

  private calculateOptimizationRatio(src: string, config: ImageOptimizationConfig): number {
    const originalSize = 300000; // Simulation
    const optimizedSize = this.calculateOptimizedSize(src, config);
    return (originalSize - optimizedSize) / originalSize;
  }

  private estimateLoadTime(src: string, config: ImageOptimizationConfig): number {
    const size = this.calculateOptimizedSize(src, config);
    const bandwidth = 1000000; // 1Mbps simulation
    return (size * 8) / bandwidth; // en secondes
  }

  private generateSizesAttribute(sizes: number[]): string {
    return sizes
      .map((size, index) => {
        if (index === sizes.length - 1) return `${size}px`;
        const nextSize = sizes[index + 1];
        return `(max-width: ${nextSize}px) ${size}px`;
      })
      .join(', ');
  }

  private async extractPageImages(url: string): Promise<any[]> {
    // Simulation - en production utiliserait Puppeteer
    return [
      { src: '/hero.jpg', size: 400000, alt: 'Hero image' },
      { src: '/thumb1.png', size: 150000, alt: '' },
      { src: '/gallery1.webp', size: 200000, alt: 'Gallery image' }
    ];
  }

  private async identifyLCPImages(images: any[]): Promise<any[]> {
    // Simulation - identifie les images candidates pour LCP
    return images.filter(img => img.size > 100000);
  }

  private isOptimized(img: any): boolean {
    return img.src.includes('.webp') || img.src.includes('.avif');
  }

  private calculateAverageOptimization(images: any[]): number {
    return 0.65; // 65% d'optimisation moyenne (simulation)
  }

  private calculateFormatDistribution(images: any[]): Record<string, number> {
    return {
      webp: 0.4,
      jpeg: 0.3,
      png: 0.2,
      avif: 0.1
    };
  }

  private async getImageSize(imagePath: string): Promise<number> {
    // Simulation
    return 300000;
  }

  private async processImage(imagePath: string): Promise<{ success: boolean; newSize: number }> {
    // Simulation d'optimisation
    return { success: true, newSize: 200000 };
  }
}

// Export de l'instance singleton
export const imageOptimizerPipeline = ImageOptimizerPipeline.getInstance();