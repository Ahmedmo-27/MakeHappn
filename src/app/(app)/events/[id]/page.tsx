import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

export default function EventIndex({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <Go params={params} />
    </Suspense>
  );
}

async function Go({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  const { id } = await params;
  redirect(`/events/${id}/backlog`);
}
