import React, { useMemo, useState, useEffect, useRef } from 'react';
import { StatsCardsSkeleton } from './charts/ChartSkeletons';
import { LucideIcon } from 'lucide-react';

/**
 * Structure for individual stat card data
 */
export interface StatCardItem {
  count: string | number;
  percentage?: string;
  color_code?: string;
}

/**
 * Dynamic stats data structure - keys can be any string
 * Example: { "Total": { count: "1000", color_code: "#820d76" }, ... }
 */
export type StatsData = Record<string, StatCardItem>;

/**
 * Optional custom labels mapping - if not provided, keys from data will be used
 */
export interface CustomLabels {
  [key: string]: string;
}

/**
 * Optional icons mapping - maps data keys to icon components
 */
export interface CustomIcons {
  [key: string]: LucideIcon | React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

/**
 * Props for StatsCards component
 */
export interface StatsCardsProps {
  /**
   * Dynamic stats data - accepts any number of keys
   * Each key should have: count (required), percentage (optional), color_code (optional)
   */
  data: StatsData;
  
  /**
   * Optional custom labels to override key names
   * Example: { "Total": "Total Installs", "Valid": "Valid Installs" }
   */
  customLabels?: CustomLabels;
  
  /**
   * Optional icons mapping - maps data keys to icon components
   * Example: { "Total": Download, "Valid": CheckCircle2, "Invalid": XCircle }
   */
  icons?: CustomIcons;
  
  /**
   * Loading state
   */
  isLoading?: boolean;
  
  /**
   * Card height - defaults to 100px
   */
  cardHeight?: number | string;
  
  /**
   * Grid columns configuration
   * Defaults to responsive: 1 on mobile, 3 on desktop
   */
  gridCols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  
  /**
   * Default border color if color_code is not provided
   */
  defaultBorderColor?: string;
  
  /**
   * Default text color for count if color_code is not provided
   */
  defaultCountColor?: string;
  
  /**
   * Show percentage badge - defaults to true if percentage exists
   */
  showPercentage?: boolean;
  
  /**
   * Custom className for the container
   */
  className?: string;
  
  /**
   * Number of skeleton cards to show when loading
   * If not provided, will use the number of keys in data or default to 3
   */
  skeletonCardCount?: number;
}

/**
 * Hook to animate number counting with proper dependency tracking
 * Only animates when targetValue actually changes
 */
const useCountUp = (
  targetValue: string | number,
  duration: number = 1500
) => {
  // Memoize the numeric target to ensure stable reference
  const targetNum = useMemo(() => {
    const num =
      typeof targetValue === "string"
        ? Number.parseFloat(targetValue)
        : targetValue;
    return Number.isNaN(num) ? 0 : num;
  }, [targetValue]);

  const [count, setCount] = useState<number>(0);
  
  const animationRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);
  const initialTargetRef = useRef<number>(targetNum);

  useEffect(() => {
    // Only animate if:
    // 1. Haven't animated yet (initial mount)
    // 2. OR the target value has actually changed
    const shouldAnimate = 
      !hasAnimatedRef.current || 
      initialTargetRef.current !== targetNum;

    if (!shouldAnimate) {
      return;
    }

    // Mark as animated and store current target
    hasAnimatedRef.current = true;
    initialTargetRef.current = targetNum;

    let startTime: number | null = null;
    setCount(0);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;

      const progress = Math.min(
        (timestamp - startTime) / duration,
        1
      );

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(targetNum * easeOut);

      setCount(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCount(targetNum);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetNum, duration]);

  return count;
};

/**
 * Animated count component with formatting
 */
const AnimatedCount = ({
  targetValue,
}:{targetValue: string | number}) => {
  const animatedCount = useCountUp(targetValue);
  
  // Format number with locale string
  const formatNumber = (value: number): string => {
    if (Number.isNaN(value)) return '0';
    return value.toLocaleString('en-US');
  };

  return <>{formatNumber(animatedCount)}</>;
};

/**
 * StatsCards Component
 * 
 * A fully dynamic component that renders stat cards based on the provided data structure.
 * Automatically handles any number of cards and uses color codes from the response.
 * 
 * @example
 * ```tsx
 * <StatsCards
 *   data={{
 *     "Total": { count: "2189869", color_code: "#820d76" },
 *     "Valid": { count: "2153750", percentage: "98.35%", color_code: "#008000" },
 *     "Invalid": { count: "36119", percentage: "1.65%", color_code: "#FF0000" }
 *   }}
 *   customLabels={{ "Total": "Total Installs" }}
 *   isLoading={false}
 * />
 * ```
 */
const StatsCards = ({
  data,
  customLabels = {},
  icons = {},
  isLoading = false,
  cardHeight = 100,
  gridCols = {
    mobile: 1,
    tablet: 1,
    desktop: 3,
  },
  defaultBorderColor = '#7C3AED',
  defaultCountColor = '#000000',
  showPercentage = true,
  className = '',
  skeletonCardCount,
}: StatsCardsProps) => {
  /**
   * Transform data into array of card items with proper ordering
   */
  const cardItems = useMemo(() => {
    if (!data || typeof data !== 'object') {
      return [];
    }

    return Object.entries(data)
      .filter(([_, value]) => value && typeof value === 'object')
      .map(([key, value]) => {
        const item = value as StatCardItem;
        return {
          key,
          label: customLabels[key] || key,
          count: item.count ?? 0,
          percentage: item.percentage,
          colorCode: item.color_code || defaultBorderColor,
        };
      });
  }, [data, customLabels, defaultBorderColor]);

  /**
   * Get grid columns class
   * Tailwind requires full class names, so we map common values
   */
  const getGridColsClass = () => {
    const mobile = gridCols.mobile ?? 1;
    const tablet = gridCols.tablet ?? gridCols.mobile ?? 1;
    const desktop = gridCols.desktop ?? 3;
    
    // Map to Tailwind classes
    const colsMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };
    
    const mobileClass = colsMap[mobile] || 'grid-cols-1';
    const tabletClass = colsMap[tablet] || 'grid-cols-1';
    const desktopClass = colsMap[desktop] || 'grid-cols-3';
    
    return `${mobileClass} sm:${tabletClass} md:${desktopClass} lg:${desktopClass} xl:${desktopClass}`;
  };

  /**
   * Get card height style
   */
  const getCardHeightStyle = (): string => {
    if (typeof cardHeight === 'number') {
      return `${cardHeight}px`;
    }
    return cardHeight;
  };

  // Show skeleton when loading
  if (isLoading) {
    const count = skeletonCardCount ?? (cardItems.length > 0 ? cardItems.length : 3);
    return (
      <StatsCardsSkeleton
        cardCount={count}
        cardHeight={cardHeight}
        gridCols={gridCols}
        className={className}
      />
    );
  }

  // Return null if no data and not loading
  if (cardItems.length === 0) {
    return null;
  }

  return (
    <div className={`grid ${getGridColsClass()} w-full gap-6 ${className}`}>
      {cardItems.map((item, index) => {
        const hasPercentage = showPercentage && item.percentage;
        const borderColor = item.colorCode;
        const countColor = item.colorCode !== defaultBorderColor ? item.colorCode : defaultCountColor;

        return (
          <div 
            key={item.key} 
            className="flex-1 group"
            style={{
              animation: `slideInUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.15}s both`,
            }}
          >
            {/* Premium Card Container */}
            <div
              className="relative h-full overflow-hidden dark:bg-gradient-to-br dark:from-slate-800/60 dark:via-slate-900/40 dark:to-slate-950/60 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl border border-gradient-to-br border-border/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3"
              style={{
                height: getCardHeightStyle(),
                borderImage: `linear-gradient(135deg, ${borderColor}40, ${borderColor}10) 1`,
              }}
            >
              {/* Gradient Top Border Accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-all duration-500"
                style={{
                  background: `linear-gradient(90deg, ${borderColor}, ${borderColor}40, transparent)`,
                }}
              />

              {/* Premium Background Blur Effect */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-all duration-700 pointer-events-none"
                style={{
                  background: borderColor,
                }}
              />

              {/* Left accent glow */}
              <div
                className="absolute -left-10 top-1/2 w-24 h-24 rounded-full blur-2xl opacity-5 transition-all duration-500 group-hover:opacity-15"
                style={{
                  background: borderColor,
                  transform: 'translateY(-50%)',
                }}
              />

              {/* Icon Container - Premium Styling */}
              {icons[item.key] && (() => {
                const IconComponent = icons[item.key];
                return (
                  <div className="absolute top-4 right-4 z-10">
                    <div 
                      className="inline-flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg backdrop-blur-md"
                      style={{ 
                        backgroundColor: `${borderColor}25`,
                        border: `1.5px solid ${borderColor}30`,
                      }}
                    >
                      <IconComponent 
                        className="w-5 h-5 transition-all duration-300 group-hover:rotate-12"
                        style={{ color: borderColor }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Content Area */}
              <div className="relative h-full flex flex-col justify-between p-6">
                {/* Top Section - Label */}
                <div className="flex-1 flex items-start">
                  <div className="text-xs sm:text-sm font-semibold text-muted-foreground/70 uppercase tracking-widest">
                    {item.label}
                  </div>
                </div>

                {/* Bottom Section - Count & Percentage */}
                <div className="flex flex-col gap-3 items-start">
                  {/* Large Count Display */}
                  <div className="flex items-baseline gap-3">
                    <div
                      className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter transition-all duration-300 group-hover:scale-105 origin-left"
                      style={{ color: borderColor }}
                    >
                      <AnimatedCount targetValue={item.count} />
                    </div>
                  </div>

                  {/* Percentage Badge */}
                  {hasPercentage && (
                    <div
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl backdrop-blur-md"
                      style={{
                        backgroundColor: `${borderColor}20`,
                        color: borderColor,
                        border: `1.5px solid ${borderColor}50`,
                      }}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: borderColor }} />
                      {item.percentage}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Right Decorative Element */}
              <div
                className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-3xl opacity-5 transition-all duration-500 group-hover:opacity-10"
                style={{
                  background: `linear-gradient(135deg, ${borderColor}, transparent)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
