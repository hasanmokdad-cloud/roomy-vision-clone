export default function FluidBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[#0b0b0f]" />
      <div className="absolute inset-0 animate-fluid bg-[radial-gradient(800px_400px_at_20%_-10%,rgba(107,33,168,0.20),transparent),radial-gradient(800px_400px_at_80%_-20%,rgba(37,99,235,0.22),transparent),radial-gradient(900px_500px_at_50%_120%,rgba(16,185,129,0.20),transparent)] blur-2xl" />
    </div>
  );
}
