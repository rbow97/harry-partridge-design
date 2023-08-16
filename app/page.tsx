export default function Home() {
  return (
    <div className="h-full">
      <video
        className="object-cover h-full w-full"
        muted
        autoPlay
        src="/assets/harry-grad-movie.mp4"
        loop
        playsInline
      />
    </div>
  );
}
