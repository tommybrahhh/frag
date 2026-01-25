'use client';

const VideoHero = () => {
  return (
    <section className="px-6 max-w-[1400px] mx-auto mb-20 pt-8">
      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm aspect-video lg:aspect-[21/9]">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/video.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
    </section>
  );
};

export default VideoHero;
