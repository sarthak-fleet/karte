// Sits inside the dashboard layout so the sidebar stays mounted across
// navigations and only the main panel shimmers. Visible the instant a
// user clicks a sidebar link.
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-48 rounded-md bg-white/[0.06]" />
      <div className="space-y-3">
        <div className="h-24 w-full rounded-2xl bg-white/[0.025]" />
        <div className="h-24 w-full rounded-2xl bg-white/[0.025]" />
        <div className="h-24 w-3/4 rounded-2xl bg-white/[0.025]" />
      </div>
    </div>
  );
}
