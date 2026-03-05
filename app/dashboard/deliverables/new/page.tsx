import { Suspense } from "react";
import NewDeliverableClient from "./NewDeliverableClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewDeliverableClient />
    </Suspense>
  );
}
