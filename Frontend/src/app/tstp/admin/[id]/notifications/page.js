'use client';

import { useSearchParams } from 'next/navigation';
import NotificationComponent from '@/components/ParentDashbord';

export default function NotificationsPage() {
  const searchParams = useSearchParams();

  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const filter = searchParams.get('filter');
  const category = searchParams.get('category'); // Add this

  return (
    <NotificationComponent
      startDate={startDate}
      endDate={endDate}
      filter={filter}
      category={category} // Pass to component
    />
  );
}

