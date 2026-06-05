import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authenticated/leads")({
  component: () => <Outlet />,
});