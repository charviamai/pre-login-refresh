
export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  timestamp: number;
  retryCount: number;
}

// Interface for the client that will handle replayed requests
interface RequestHandler {
  post: (url: string, data?: any) => Promise<any>;
  put: (url: string, data?: any) => Promise<any>;
  patch: (url: string, data?: any) => Promise<any>;
  delete: (url: string) => Promise<any>;
}

class OfflineService {
  private queue: QueuedRequest[] = [];
  private readonly STORAGE_KEY = 'offline_request_queue';
  private listeners: Array<(isOnline: boolean) => void> = [];
  private requestHandler: RequestHandler | null = null;

  constructor() {
    this.loadQueue();
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    // Listen for offline API errors
    window.addEventListener('api:offline-error', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this.queueRequest(detail.url, detail.method, detail.data);
    });
  }

  setRequestHandler(handler: RequestHandler) {
    this.requestHandler = handler;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  // --------------------------------------------------------------------------
  // Queue Management
  // --------------------------------------------------------------------------

  private loadQueue() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse offline queue:', e);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('offline-queue-change', { detail: { count: this.queue.length } }));
    } catch (e) {
      console.error('Failed to save offline queue:', e);
    }
  }

  queueRequest(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', data?: any) {
    const request: QueuedRequest = {
      id: crypto.randomUUID(),
      url,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(request);
    this.saveQueue();
    
    // Dispatch event for success toast
    window.dispatchEvent(new CustomEvent('api:offline-queued'));
    

  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  // --------------------------------------------------------------------------
  // Sync Logic
  // --------------------------------------------------------------------------

  async syncQueue(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline() || this.queue.length === 0 || !this.requestHandler) {
      if (!this.requestHandler && this.queue.length > 0) console.warn('[OfflineService] No request handler set - cannot sync');
      return { success: 0, failed: 0 };
    }


    
    const results = { success: 0, failed: 0 };
    const remainingQueue: QueuedRequest[] = [];

    // Process queue sequentially to maintain order
    for (const req of this.queue) {
      try {

        
        switch (req.method) {
          case 'POST':
            await this.requestHandler.post(req.url, req.data);
            break;
          case 'PUT':
            await this.requestHandler.put(req.url, req.data);
            break;
          case 'PATCH':
            await this.requestHandler.patch(req.url, req.data);
            break;
          case 'DELETE':
            await this.requestHandler.delete(req.url);
            break;
        }
        

        results.success++;
      } catch (err: any) {




        req.retryCount++;
        
        // Remove if too many retries (e.g., 5) or specific non-retriable errors (400, 404)
        // For now, keep retrying if it's a network error (status 0) or server error (500)
        // But drop if it's a client error logic (4xx)
        const statusCode = err?.response?.status || 0;
        const isClientError = statusCode >= 400 && statusCode < 500;
        
        if (req.retryCount < 5 && !isClientError) {

          remainingQueue.push(req);
        } else {

          results.failed++;
          
          // Dispatch error event
          window.dispatchEvent(new CustomEvent('offline-sync:error', {
            detail: { 
              url: req.url,
              method: req.method,
              message: isClientError ? 'Request invalid' : 'Max retries exceeded',
              statusCode
            }
          }));
        }
      }
    }

    this.queue = remainingQueue;
    this.saveQueue();
    
    // Dispatch sync success event if all requests were processed
    if (results.success > 0 && remainingQueue.length === 0) {
      window.dispatchEvent(new CustomEvent('offline-sync:success'));
    }
    

    return results;
  }

  // --------------------------------------------------------------------------
  // Connection Events
  // --------------------------------------------------------------------------

  private handleOnline = () => {

    this.notifyListeners(true);
    // Auto-sync when coming back online
    this.syncQueue();
  };

  private handleOffline = () => {

    this.notifyListeners(false);
  };

  subscribe(callback: (isOnline: boolean) => void) {
    this.listeners.push(callback);
    // Initial call
    callback(this.isOnline());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(l => l(isOnline));
  }
}

export const offlineService = new OfflineService();
