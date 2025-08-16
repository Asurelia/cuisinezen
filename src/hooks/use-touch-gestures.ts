/**
 * Custom hook for touch gestures and mobile interactions
 * Provides swipe, pinch, tap, and long press gesture recognition
 */

import { useRef, useEffect, useCallback, useState } from 'react';

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  deltaX: number;
  deltaY: number;
}

export interface PinchEvent {
  scale: number;
  center: TouchPoint;
  velocity: number;
}

export interface TapEvent {
  x: number;
  y: number;
  tapCount: number;
}

export interface LongPressEvent {
  x: number;
  y: number;
  duration: number;
}

export interface TouchGestureOptions {
  onSwipe?: (event: SwipeEvent) => void;
  onPinch?: (event: PinchEvent) => void;
  onTap?: (event: TapEvent) => void;
  onLongPress?: (event: LongPressEvent) => void;
  onTouchStart?: (event: TouchEvent) => void;
  onTouchMove?: (event: TouchEvent) => void;
  onTouchEnd?: (event: TouchEvent) => void;
  
  // Configuration
  swipeThreshold?: number;
  velocityThreshold?: number;
  longPressDelay?: number;
  tapTimeout?: number;
  pinchThreshold?: number;
  preventScroll?: boolean;
  enableHapticFeedback?: boolean;
}

interface TouchState {
  startPoints: TouchPoint[];
  currentPoints: TouchPoint[];
  isMoving: boolean;
  startTime: number;
  tapCount: number;
  longPressTimer?: NodeJS.Timeout;
  lastTapTime: number;
}

const defaultOptions: Required<TouchGestureOptions> = {
  onSwipe: () => {},
  onPinch: () => {},
  onTap: () => {},
  onLongPress: () => {},
  onTouchStart: () => {},
  onTouchMove: () => {},
  onTouchEnd: () => {},
  swipeThreshold: 50,
  velocityThreshold: 0.3,
  longPressDelay: 500,
  tapTimeout: 300,
  pinchThreshold: 0.1,
  preventScroll: false,
  enableHapticFeedback: true
};

export function useTouchGestures(options: TouchGestureOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const touchState = useRef<TouchState>({
    startPoints: [],
    currentPoints: [],
    isMoving: false,
    startTime: 0,
    tapCount: 0,
    lastTapTime: 0
  });

  const config = { ...defaultOptions, ...options };

  // Haptic feedback helper
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (config.enableHapticFeedback && 'navigator' in window && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [config.enableHapticFeedback]);

  // Get touch points from event
  const getTouchPoints = useCallback((event: TouchEvent): TouchPoint[] => {
    return Array.from(event.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));
  }, []);

  // Calculate distance between two points
  const getDistance = useCallback((point1: TouchPoint, point2: TouchPoint): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate velocity
  const getVelocity = useCallback((start: TouchPoint, end: TouchPoint): number => {
    const distance = getDistance(start, end);
    const time = end.timestamp - start.timestamp;
    return time > 0 ? distance / time : 0;
  }, [getDistance]);

  // Determine swipe direction
  const getSwipeDirection = useCallback((start: TouchPoint, end: TouchPoint): 'left' | 'right' | 'up' | 'down' => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    const points = getTouchPoints(event);
    const state = touchState.current;

    state.startPoints = points;
    state.currentPoints = points;
    state.isMoving = false;
    state.startTime = Date.now();

    // Clear any existing long press timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
    }

    // Start long press timer for single touch
    if (points.length === 1) {
      state.longPressTimer = setTimeout(() => {
        if (!state.isMoving && state.startPoints.length === 1) {
          triggerHapticFeedback('medium');
          config.onLongPress({
            x: points[0].x,
            y: points[0].y,
            duration: Date.now() - state.startTime
          });
        }
      }, config.longPressDelay);
    }

    if (config.preventScroll) {
      event.preventDefault();
    }

    config.onTouchStart(event);
  }, [config, getTouchPoints, triggerHapticFeedback]);

  // Handle touch move
  const handleTouchMove = useCallback((event: TouchEvent) => {
    const points = getTouchPoints(event);
    const state = touchState.current;

    state.currentPoints = points;

    if (!state.isMoving) {
      // Check if we've moved enough to cancel long press
      if (state.startPoints.length > 0) {
        const distance = getDistance(state.startPoints[0], points[0]);
        if (distance > 10) {
          state.isMoving = true;
          if (state.longPressTimer) {
            clearTimeout(state.longPressTimer);
            state.longPressTimer = undefined;
          }
        }
      }
    }

    // Handle pinch gesture
    if (state.startPoints.length === 2 && points.length === 2) {
      const startDistance = getDistance(state.startPoints[0], state.startPoints[1]);
      const currentDistance = getDistance(points[0], points[1]);
      const scale = currentDistance / startDistance;

      if (Math.abs(scale - 1) > config.pinchThreshold) {
        const center = {
          x: (points[0].x + points[1].x) / 2,
          y: (points[0].y + points[1].y) / 2,
          timestamp: Date.now()
        };

        const velocity = getVelocity(
          {
            x: (state.startPoints[0].x + state.startPoints[1].x) / 2,
            y: (state.startPoints[0].y + state.startPoints[1].y) / 2,
            timestamp: state.startTime
          },
          center
        );

        config.onPinch({
          scale,
          center,
          velocity
        });
      }
    }

    if (config.preventScroll) {
      event.preventDefault();
    }

    config.onTouchMove(event);
  }, [config, getTouchPoints, getDistance, getVelocity]);

  // Handle touch end
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    const state = touchState.current;

    // Clear long press timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = undefined;
    }

    // Handle swipe gesture
    if (state.startPoints.length === 1 && state.currentPoints.length >= 1 && state.isMoving) {
      const start = state.startPoints[0];
      const end = state.currentPoints[0];
      const distance = getDistance(start, end);
      const velocity = getVelocity(start, end);

      if (distance > config.swipeThreshold && velocity > config.velocityThreshold) {
        const direction = getSwipeDirection(start, end);
        
        triggerHapticFeedback('light');
        config.onSwipe({
          direction,
          distance,
          velocity,
          deltaX: end.x - start.x,
          deltaY: end.y - start.y
        });
      }
    }

    // Handle tap gesture
    if (!state.isMoving && state.startPoints.length === 1) {
      const now = Date.now();
      const timeSinceLastTap = now - state.lastTapTime;
      
      if (timeSinceLastTap < config.tapTimeout) {
        state.tapCount++;
      } else {
        state.tapCount = 1;
      }

      state.lastTapTime = now;

      // Use a small delay to detect double/triple taps
      setTimeout(() => {
        if (state.lastTapTime === now) {
          triggerHapticFeedback('light');
          config.onTap({
            x: state.startPoints[0].x,
            y: state.startPoints[0].y,
            tapCount: state.tapCount
          });
          state.tapCount = 0;
        }
      }, config.tapTimeout);
    }

    // Reset state
    state.startPoints = [];
    state.currentPoints = [];
    state.isMoving = false;

    config.onTouchEnd(event);
  }, [config, getDistance, getVelocity, getSwipeDirection, triggerHapticFeedback]);

  // Add event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const touchStartOptions = { passive: !config.preventScroll };
    const touchMoveOptions = { passive: !config.preventScroll };
    const touchEndOptions = { passive: true };

    element.addEventListener('touchstart', handleTouchStart, touchStartOptions);
    element.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    element.addEventListener('touchend', handleTouchEnd, touchEndOptions);
    element.addEventListener('touchcancel', handleTouchEnd, touchEndOptions);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, config.preventScroll]);

  return {
    ref,
    triggerHapticFeedback
  };
}

/**
 * Hook for swipe-to-action functionality (like delete, archive, etc.)
 */
export function useSwipeAction(options: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enableHapticFeedback?: boolean;
} = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 100,
    enableHapticFeedback = true
  } = options;

  return useTouchGestures({
    onSwipe: (event) => {
      if (event.distance > threshold) {
        if (event.direction === 'left' && onSwipeLeft) {
          onSwipeLeft();
        } else if (event.direction === 'right' && onSwipeRight) {
          onSwipeRight();
        }
      }
    },
    swipeThreshold: threshold,
    enableHapticFeedback
  });
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void, options: {
  threshold?: number;
  enabled?: boolean;
} = {}) {
  const { threshold = 100, enabled = true } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const { ref } = useTouchGestures({
    onTouchMove: (event) => {
      if (!enabled || isRefreshing) return;

      const touch = event.touches[0];
      if (touch && window.scrollY === 0) {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) {
          const distance = Math.max(0, touch.clientY - rect.top);
          setPullDistance(Math.min(distance, threshold * 1.5));
        }
      }
    },
    onTouchEnd: async () => {
      if (!enabled || isRefreshing || pullDistance < threshold) {
        setPullDistance(0);
        return;
      }

      setIsRefreshing(true);
      setPullDistance(0);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    },
    enableHapticFeedback: true
  });

  return {
    ref,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1)
  };
}

/**
 * Hook for zoom and pan functionality
 */
export function useZoomPan(options: {
  minScale?: number;
  maxScale?: number;
  onZoomChange?: (scale: number) => void;
} = {}) {
  const { minScale = 0.5, maxScale = 3, onZoomChange } = options;
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const { ref } = useTouchGestures({
    onPinch: (event) => {
      const newScale = Math.max(minScale, Math.min(maxScale, scale * event.scale));
      setScale(newScale);
      onZoomChange?.(newScale);
    },
    onSwipe: (event) => {
      if (scale > 1) {
        setPosition(prev => ({
          x: prev.x + event.deltaX,
          y: prev.y + event.deltaY
        }));
      }
    },
    enableHapticFeedback: true
  });

  const reset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    onZoomChange?.(1);
  }, [onZoomChange]);

  return {
    ref,
    scale,
    position,
    reset,
    transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`
  };
}