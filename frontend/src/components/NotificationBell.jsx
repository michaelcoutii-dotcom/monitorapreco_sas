import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteAllNotifications } from '../api/notifications';

/**
 * NotificationBell - Bell icon component showing notifications dropdown
 */
export default function NotificationBell({ onShowProductHistory }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Query for unread count (polls every 30 seconds)
    const { data: unreadData } = useQuery({
        queryKey: ['notifications-unread'],
        queryFn: getUnreadCount,
        refetchInterval: 30000, // Poll every 30 seconds
        staleTime: 10000,
    });

    // Query for notifications list
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        enabled: isOpen, // Only fetch when dropdown is open
        staleTime: 5000,
    });

    const unreadCount = unreadData?.count || 0;

    // Mutation for marking as read
    const { mutate: markRead } = useMutation({
        mutationFn: markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
        }
    });

    // Mutation for marking all as read
    const { mutate: markAllRead } = useMutation({
        mutationFn: markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
        }
    });

    // Mutation for deleting all
    const { mutate: deleteAll } = useMutation({
        mutationFn: deleteAllNotifications,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
        }
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Format time ago
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'agora';
        if (diffMins < 60) return `${diffMins}min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('pt-BR');
    };

    // Get icon for notification type
    const getTypeIcon = (type) => {
        switch (type) {
            case 'PRICE_DROP': return '🔻';
            case 'PRICE_INCREASE': return '📈';
            case 'PRODUCT_ADDED': return '✅';
            case 'SYSTEM': return '⚠️';
            default: return '🔔';
        }
    };

    // Get color for notification type
    const getTypeColor = (type) => {
        switch (type) {
            case 'PRICE_DROP': return 'text-green-400';
            case 'PRICE_INCREASE': return 'text-red-400';
            case 'PRODUCT_ADDED': return 'text-blue-400';
            case 'SYSTEM': return 'text-amber-400';
            default: return 'text-slate-400';
        }
    };

    // Handle notification click - navigate to relevant page
    const handleNotificationClick = (notification) => {
        // Mark as read first
        if (!notification.isRead) {
            markRead(notification.id);
        }

        // Close dropdown
        setIsOpen(false);

        // Navigate based on notification type
        switch (notification.type) {
            case 'PRICE_DROP':
            case 'PRICE_INCREASE':
                // If we have a product ID and a callback to show history, use it
                if (notification.productId && onShowProductHistory) {
                    onShowProductHistory({
                        id: notification.productId,
                        name: notification.productName
                    });
                }
                break;
            case 'SYSTEM':
                // System notifications (like verify email) go to settings
                navigate('/settings');
                break;
            case 'PRODUCT_ADDED':
                // Just close, user is already on dashboard
                break;
            default:
                break;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 transition-all"
                title="Notificações"
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-slate-300"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                    />
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] sm:w-96 max-w-96 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            🔔 Notificações
                            {unreadCount > 0 && (
                                <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <>
                                    <button
                                        onClick={() => markAllRead()}
                                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                                        title="Marcar todas como lidas"
                                    >
                                        ✓ Ler todas
                                    </button>
                                    <span className="text-slate-600">|</span>
                                    <button
                                        onClick={() => deleteAll()}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                        title="Limpar todas"
                                    >
                                        🗑️
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-slate-400 text-sm mt-2">Carregando...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-4xl mb-3">📭</div>
                                <p className="text-slate-400 text-sm">Nenhuma notificação</p>
                                <p className="text-slate-500 text-xs mt-1">
                                    Você será notificado quando os preços mudarem
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                                        !notification.isRead ? 'bg-slate-700/20' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <span className={`text-xl flex-shrink-0 ${getTypeColor(notification.type)}`}>
                                            {getTypeIcon(notification.type)}
                                        </span>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${notification.isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-slate-500">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </span>
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-700">
                            <p className="text-xs text-slate-500 text-center">
                                Mostrando últimas {notifications.length} notificações
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
