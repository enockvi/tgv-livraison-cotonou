import { useEffect, useState } from 'react';
import { flushOrderQueue, getPendingCount, subscribeOrderQueue } from '../data/orderQueue';

/**
 * Suit l'état réseau et le nombre de commandes en attente dans la file hors-ligne.
 *
 * La file elle-même vit dans `src/data/orderQueue.ts` (source de vérité unique, utilisée
 * directement par `Step4Confirmation`). Ce hook ne fait que l'observer et déclencher la
 * resynchronisation au retour de la connexion — la promesse affichée dans l'UI est donc
 * réellement tenue.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(() => getPendingCount());

  useEffect(() => {
    const unsubscribe = subscribeOrderQueue(setPendingCount);

    const handleOnline = () => {
      setIsOnline(true);
      void flushOrderQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // État initial : resynchronise immédiatement si une file existe et que le réseau est là.
    setPendingCount(getPendingCount());
    if (navigator.onLine && getPendingCount() > 0) {
      void flushOrderQueue();
    }

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, pendingCount };
}
