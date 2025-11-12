export default function FluidBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-[#090E1A] via-[#0F1624] to-[#15203B]" />
      <div className="absolute inset-0 animate-fluid bg-[radial-gradient(800px_400px_at_20%_-10%,rgba(168,85,247,0.25),transparent),radial-gradient(800px_400px_at_80%_-20%,rgba(59,130,246,0.28),transparent),radial-gradient(900px_500px_at_50%_120%,rgba(52,211,153,0.25),transparent)] blur-2xl" />
    </div>
  );
}
