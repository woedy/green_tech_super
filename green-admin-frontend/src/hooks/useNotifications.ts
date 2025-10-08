/**
 * Real-time notifications hook for the admin portal.
 * Handles WebSocket connections and system monitoring with Ghana-specific features.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  subject: string;
  message: string;
  notification_type: 'email' | 'sms' | 'push' | 'in_app';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  content_object?: any;
}

export interface NotificationStats {
  total: number;
  unread: number;
  sent_today: number;
  failed: number;
  sent_this_week: number;
  by_type: Record<string, number>;
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

export interface NotificationEvent {
  type: 'notification' | 'notification_update' | 'unread_count' | 'notification_stats' | 'system_alert';
  notification?: Notification;
  notification_id?: string;
  status?: string;
  read_at?: string;
  count?: number;
  stats?: NotificationStats;
  alert?: SystemAlert;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  stats: NotificationStats | null;
  systemAlerts: SystemAlert[];
  markAsRead: (notificationIds: string[]) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => void;
  getStats: () => void;
  requestPermission: () => Promise<boolean>;
  isSupported: boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSupported] = useState(() => 'Notification' in window && 'serviceWorker' in navigator);

  // Create WebSocket URL for admin monitoring
  const createWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/notifications/`;
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Show browser notification with admin-specific styling
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (!isSupported || Notification.permission !== 'granted') return;

    try {
      const browserNotification = new Notification(notification.subject, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: notification.priority === 'low',
      });

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => browserNotification.close(), 5000);
      }

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }, [isSupported]);

  // Show system alert notification
  const showSystemAlert = useCallback((alert: SystemAlert) => {
    const alertType = alert.type === 'error' ? 'destructive' : alert.type === 'warning' ? 'warning' : 'default';
    
    toast(alert.title, {
      description: alert.message,
      duration: alert.type === 'error' ? 10000 : 5000,
      className: `admin-alert admin-alert-${alert.type}`,
    });

    // Show browser notification for critical alerts
    if (alert.type === 'error' && isSupported && Notification.permission === 'granted') {
      new Notification(`System Alert: ${alert.title}`, {
        body: alert.message,
        icon: '/favicon.ico',
        requireInteraction: true,
      });
    }
  }, [isSupported]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!isAuthenticated || !user || !user.is_staff) return;

    try {
      const socket = new WebSocket(createWebSocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log('Admin connected to notifications WebSocket');
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Request initial stats
        getStats();
      };

      socket.onmessage = (event) => {
        try {
          const data: NotificationEvent = JSON.parse(event.data);
          
          switch (data.type) {
            case 'notification':
              if (data.notification) {
                setNotifications(prev => [data.notification!, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                // Show toast notification with admin-specific styling
                toast(data.notification.subject, {
                  description: data.notification.message,
                  duration: data.notification.priority === 'urgent' ? 10000 : 5000,
                  className: 'admin-notification',
                });
                
                // Show browser notification if permission granted
                showBrowserNotification(data.notification);
              }
              break;
              
            case 'notification_update':
              if (data.notification_id && data.status) {
                setNotifications(prev => 
                  prev.map(n => 
                    n.id === data.notification_id 
                      ? { ...n, status: data.status as any, read_at: data.read_at }
                      : n
                  )
                );
              }
              break;
              
            case 'unread_count':
              if (typeof data.count === 'number') {
                setUnreadCount(data.count);
              }
              break;

            case 'notification_stats':
              if (data.stats) {
                setStats(data.stats);
              }
              break;

            case 'system_alert':
              if (data.alert) {
                setSystemAlerts(prev => [data.alert!, ...prev.slice(0, 49)]); // Keep last 50 alerts
                showSystemAlert(data.alert);
              }
              break;
          }
        } catch (error) {
          console.error('Failed to parse notification event:', error);
        }
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        socketRef.current = null;
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && isAuthenticated) {
          console.log('WebSocket closed, attempting to reconnect...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [isAuthenticated, user, createWebSocketUrl, showBrowserNotification, showSystemAlert]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000); // Clean close
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Send message to WebSocket
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback((notificationIds: string[]) => {
    sendMessage({
      type: 'mark_read',
      notification_ids: notificationIds
    });
  }, [sendMessage]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    sendMessage({
      type: 'mark_all_read'
    });
  }, [sendMessage]);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    sendMessage({
      type: 'get_unread_count'
    });
  }, [sendMessage]);

  // Get notification statistics
  const getStats = useCallback(() => {
    sendMessage({
      type: 'get_stats'
    });
  }, [sendMessage]);

  // Connect/disconnect based on authentication
  useEffect(() => {
    if (isAuthenticated && user && user.is_staff) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  // Request notification permission on mount
  useEffect(() => {
    if (isSupported && Notification.permission === 'default') {
      requestPermission();
    }
  }, [isSupported, requestPermission]);

  // Refresh stats periodically
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        getStats();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, getStats]);

  return {
    notifications,
    unreadCount,
    isConnected,
    stats,
    systemAlerts,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    getStats,
    requestPermission,
    isSupported,
  };
}