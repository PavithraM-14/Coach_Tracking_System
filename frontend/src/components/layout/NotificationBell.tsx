import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { getNotifications, markNotificationRead } from "../../api/notifications";
import type { NotificationRow } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime } from "../../utils/dateFormat";

const POLL_INTERVAL_MS = 30000;

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function reload() {
    getNotifications()
      .then((res) => {
        setNotifications(res.data);
        setUnreadCount(res.unread_count);
      })
      .catch(() => {
        // Silent — a missed poll shouldn't interrupt the rest of the app.
      });
  }

  useEffect(() => {
    if (!user) return;
    reload();
    const interval = setInterval(reload, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAllRead() {
    await markNotificationRead();
    reload();
  }

  async function handleNotificationClick(n: NotificationRow) {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      reload();
    }
  }

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-xs font-medium text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-400">No notifications yet.</p>}
            {notifications.map((n) => {
              const content = (
                <div className={`px-3 py-2.5 ${n.is_read ? "" : "bg-blue-50"}`}>
                  <p className={`text-sm ${n.is_read ? "text-slate-600" : "font-medium text-slate-800"}`}>{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(n.created_at)}</p>
                </div>
              );
              return n.type === "COACH_COMPLETED" && user.role === "ADMIN" ? (
                <Link
                  key={n.id}
                  to={`/admin/coaches/${n.coach_id}`}
                  onClick={() => handleNotificationClick(n)}
                  className="block border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className="block w-full border-b border-slate-50 text-left last:border-0 hover:bg-slate-50"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
