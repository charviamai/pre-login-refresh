/**
 * Performance Monitoring Service
 * 
 * Uses Google's web-vitals library to track Core Web Vitals:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity  
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Initial render
 * - TTFB (Time to First Byte): Server response time
 * 
 * Future: Can integrate with analytics services (Google Analytics, DataDog, etc.)
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Thresholds based on Google's Core Web Vitals guidelines
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Converts web-vitals Metric to our internal format with rating
 */
function processMetric(metric: Metric): PerformanceMetric {
  const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS];
  let rating: 'good' | 'needs-improvement' | 'poor' = 'good';

  if (threshold) {
    if (metric.value > threshold.poor) {
      rating = 'poor';
    } else if (metric.value > threshold.good) {
      rating = 'needs-improvement';
    }
  }

  return {
    name: metric.name,
    value: metric.value,
    rating,
    delta: metric.delta,
    id: metric.id,
  };
}

/**
 * Log metric to console with color coding
 */
function logMetric(metric: PerformanceMetric): void {
  // Only log performance metrics in development
  if (import.meta.env.DEV) {
    const colors = {
      good: 'color: #0cce6b',
      'needs-improvement': 'color: #ffa400',
      poor: 'color: #ff4e42',
    };

    console.log(
      `%c[Performance] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      colors[metric.rating]
    );
  }
}

/**
 * Send metric to backend (placeholder for future analytics integration)
 */
async function sendToAnalytics(metric: PerformanceMetric): Promise<void> {
  // Future: Send to backend analytics endpoint
  // await fetch('/api/analytics/performance', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(metric),
  // });

  // For now, just log
  if (import.meta.env.DEV) {
    logMetric(metric);
  }
}

/**
 * Handler for all metrics
 */
function handleMetric(metric: Metric): void {
  const processed = processMetric(metric);
  sendToAnalytics(processed);
}

/**
 * Initialize performance monitoring
 * Call this once in App.tsx on mount
 */
export function initPerformanceMonitoring(): void {


  // Register all Core Web Vitals observers
  onCLS(handleMetric);
  onINP(handleMetric);
  onFCP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
}

/**
 * Get current performance summary
 * Useful for debugging or displaying in settings
 */
export function getPerformanceEntries(): PerformanceEntry[] {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) {
    return [];
  }

  return [
    ...performance.getEntriesByType('navigation'),
    ...performance.getEntriesByType('resource'),
    ...performance.getEntriesByType('paint'),
  ];
}
