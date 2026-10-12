"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Props = {
  error: Error;
  reset: () => void;
};

const ErrorPage = ({ error, reset }: Props) => (
  <EmptyState
    title="Something went wrong"
    description={error.message}
    action={
      <Button variant="secondary" onClick={reset}>
        Try again
      </Button>
    }
  />
);

export default ErrorPage;
