import IdeationClient from "./IdeationClient";

// Server component: simply pass the projectID to the client widget
export default async function IdeationPage({ params }: { params: Promise<{ projectID: string }> }) {
  const { projectID } = await params;
  return (
    <div className="space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <IdeationClient projectID={projectID} />
    </div>
  );
}
