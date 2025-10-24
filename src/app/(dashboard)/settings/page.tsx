import '@/styles/settings.css';
import { redirect } from 'next/navigation';

export default function Page() {
  // Redirect to the default account tab
  redirect('/settings/account');
}

