'use client';

import {useAuthState} from 'react-firebase-hooks/auth';
import {auth} from '@/lib/firebase';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {Loader2} from 'lucide-react';

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
