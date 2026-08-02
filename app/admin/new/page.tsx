import ReleaseForm from "@/components/ReleaseForm";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewReleasePage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">הודעה חדשה</h1>
      <ReleaseForm error={error} />
    </div>
  );
}