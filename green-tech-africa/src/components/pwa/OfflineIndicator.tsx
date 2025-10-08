// Offline status indicator and sync management component
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  Upload, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useOfflineActions } from '@/hooks/useOfflineProperties';
import { offlineStorage } from '@/lib/offlineStorage';
import { toast } from 'sonner';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isVisible, setIsVisible] = useState(false);
  const [cacheStats, setCacheStats] = useState<{
    properties: number;
    regions: number;
    features: number;
    actions: number;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { pendingActions, updatePendingCount } = useOfflineActions();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored! Syncing data...');
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
      toast.warning('You\'re now offline. Some features may be limited.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial cache stats
    loadCacheStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await offlineStorage.getStorageStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    try {
      // In a real app, this would trigger actual sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      await updatePendingCount();
      await loadCacheStats();
      toast.success('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = async () => {
    try {
      // Clear old cache entries
      await offlineStorage.clearOldCache();
      await loadCacheStats();
      toast.success('Cache cleaned up');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  if (!isVisible && isOnline && pendingActions === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 max-w-sm">
      <Card className={`shadow-lg transition-all duration-300 ${
        !isOnline ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-yellow-600" />
              )}
              <CardTitle className="text-lg">
                {isOnline ? 'Online' : 'Offline Mode'}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          <CardDescription>
            {isOnline 
              ? 'All features available' 
              : 'Limited features available offline'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Pending Actions */}
          {pendingActions > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Pending sync</span>
              </div>
              <Badge variant="secondary">
                {pendingActions} action{pendingActions !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}

          {/* Sync Button */}
          {isOnline && pendingActions > 0 && (
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full"
              size="sm"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          )}

          {/* Cache Statistics */}
          {cacheStats && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Cached Data</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Properties:</span>
                  <span>{cacheStats.properties}</span>
                </div>
                <div className="flex justify-between">
                  <span>Regions:</span>
                  <span>{cacheStats.regions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Features:</span>
                  <span>{cacheStats.features}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actions:</span>
                  <span>{cacheStats.actions}</span>
                </div>
              </div>
            </div>
          )}

          {/* Offline Features Available */}
          {!isOnline && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Available Offline:</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Browse cached properties</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Search Ghana locations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>View project updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  <span>Submit inquiries (sync later)</span>
                </div>
              </div>
            </div>
          )}

          {/* Cache Management */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadCacheStats}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="flex-1"
            >
              <Database className="h-3 w-3 mr-1" />
              Clean
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Simple offline status badge for header
export const OfflineStatusBadge = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { pendingActions } = useOfflineActions();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && pendingActions === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {!isOnline && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}
      {pendingActions > 0 && (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          {pendingActions} pending
        </Badge>
      )}
    </div>
  );
};