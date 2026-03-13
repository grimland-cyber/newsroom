import { notFound } from "next/navigation";
import { getReleaseById } from "@/lib/db";
import ReleaseForm from "@/components/ReleaseForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditReleasePage({ params }: Props) {
  const { id } = await params;
  const release = await getReleaseById(id);

  if (!release) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">עריכת הודעה</h1>
      <p className="text-sm text-gray-500 mb-6 font-mono">/news/{release.slug}</p>
      <ReleaseForm initial={release} />
    </div>
  );
}
