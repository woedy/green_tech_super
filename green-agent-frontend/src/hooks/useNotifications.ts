/**
 * Real-time notifications hook for the agent portal.
 * Handles WebSocket connections and push notifications with Ghana-specific features.
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

export interface NotificationEvent {
  type: 'notification' | 'notification_update' | 'unread_count';
  notification?: Notification;
  notification_id?: string;
  status?: string;
  read_at?: string;
  count?: number;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationIds: string[]) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => void;
  requestPermission: () => Promise<boolean>;
  isSupported: boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSupported] = useState(() => 'Notification' in window && 'serviceWorker' in navigator);

  // Create WebSocket URL
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

  // Show browser notification with agent-specific styling
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
        // Could navigate to relevant page based on content_object
      };
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }, [isSupported]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!isAuthenticated || !user) return;

    try {
      const socket = new WebSocket(createWebSocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log('Agent connected to notifications WebSocket');
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const data: NotificationEvent = JSON.parse(event.data);
          
          switch (data.type) {
            case 'notification':
              if (data.notification) {
                setNotifications(prev => [data.notification!, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                // Show toast notification with agent-specific styling
                toast(data.notification.subject, {
                  description: data.notification.message,
                  duration: data.notification.priority === 'urgent' ? 10000 : 5000,
                  className: 'agent-notification',
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
  }, [isAuthenticated, user, createWebSocketUrl, showBrowserNotification]);

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

  // Connect/disconnect based on authentication
  useEffect(() => {
    if (isAuthenticated && user) {
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

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    requestPermission,
    isSupported,
  };
}