'use client';

import { redirect } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function AvertissementsPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) {
    redirect('/versions/new/conflits');
  }

  redirect(`/versions/${id}/conflits`);
}
