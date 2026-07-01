import { useSubscription } from '@/lib/subscriptionContext';
import { isCriticalRoute } from '@/lib/entitlements';
import AwaitingSubscription from '@/components/AwaitingSubscription';
import BlockedScreen from '@/components/subscription/BlockedScreen';

export default function RequireEntitlement({ path, children }) {
  const { isRestricted, isBlocked } = useSubscription();

  if (isCriticalRoute(path) && isRestricted) {
    return isBlocked ? <BlockedScreen /> : <AwaitingSubscription />;
  }

  return children;
}
