import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getFullPageData } from './_lib/get-page-data';

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getFullPageData(slug);
  if (!data) return { title: 'Not Found' };

  const { page } = data;
  return {
    title: page.displayName,
    description: page.bio ?? `${page.displayName}'s links`,
    openGraph: {
      title: page.displayName,
      description: page.bio ?? `${page.displayName}'s links`,
      ...(page.avatarUrl && { images: [page.avatarUrl] }),
    },
  };
}

export default async function SlugLayout({ params, children }: Props) {
  const { slug } = await params;
  const data = await getFullPageData(slug);
  if (!data) notFound();

  return <>{children}</>;
}
