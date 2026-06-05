import { useState, useRef } from 'react';

export const usePullToRefresh = () => {
  const pullDistRef = useRef(0);
  const [pullDist, setPullDist] = useState(0);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current > 0) {
      const dist = e.touches[0].clientY - touchStartY.current;
      if (dist > 0) {
         const newDist = Math.min(dist, 100);
         pullDistRef.current = newDist;
         setPullDist(newDist);
      }
    }
  };

  const handleTouchEnd = async (onRefresh: () => Promise<void>) => {
    if (pullDistRef.current > 60) {
      setRefreshing(true);
      pullDistRef.current = 60;
      setPullDist(60); 
      try {
        await onRefresh();
      } catch (e) {
        console.error("Refresh failed", e);
      }
      setTimeout(() => {
         setRefreshing(false);
         pullDistRef.current = 0;
         setPullDist(0);
      }, 500);
    } else {
      pullDistRef.current = 0;
      setPullDist(0);
    }
    touchStartY.current = 0;
  };

  return {
    pullDist,
    scrollRef,
    refreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

export default usePullToRefresh;
