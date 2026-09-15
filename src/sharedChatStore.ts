import { ChatMessage, NotificationItem } from './types';

class SharedChatStore {
  messages: ChatMessage[] = [];
  notifications: NotificationItem[] = [];

  load(): void {
    try {
      const chatRaw = localStorage.getItem('vodacom_chat_v6') || localStorage.getItem('vodacom_chat');
      if (chatRaw) {
        this.messages = JSON.parse(chatRaw);
      }
      const notifRaw = localStorage.getItem('vodacom_notifs_v6') || localStorage.getItem('vodacom_notifs');
      if (notifRaw) {
        this.notifications = JSON.parse(notifRaw);
      }
    } catch {
      // ignore
    }
  }

  save(): void {
    try {
      localStorage.setItem('vodacom_chat_v6', JSON.stringify(this.messages));
      localStorage.setItem('vodacom_notifs_v6', JSON.stringify(this.notifications));
    } catch {
      // ignore
    }
  }

  pushNotification(item: NotificationItem): void {
    this.notifications.unshift(item);
    this.save();
  }
}

export const SHARED_CHAT_STORE = new SharedChatStore();
