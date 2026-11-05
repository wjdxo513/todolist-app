import { useMe } from '../features/auth';
import { ProfileForms } from '../features/profile';

export function ProfilePage() {
  const me = useMe();
  // RequireAuth를 지나왔으므로 me는 항상 있다
  return me.data ? <ProfileForms user={me.data} /> : null;
}
