type StoryTellingProps = {
  imageSrc?: string;
  imageAlt?: string;
};

export default function StoryTelling({
  imageSrc,
  imageAlt = "Storytelling section image",
}: StoryTellingProps) {
  return (
    <section className="bg-background text-foreground py-20">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
        
        {/* Left Side - Image with fallback */}
        <div className="w-full md:w-1/2">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-full h-72 object-cover rounded-2xl"
            />
          ) : (
            <div
              className="w-full h-72 bg-primary rounded-2xl"
              aria-label="Placeholder image"
            />
          )}
        </div>

        {/* Right Side - Text Content */}
        <div className="w-full md:w-1/2">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            What is LockIN?
          </h2>

          <p className="mb-4 text-lg">
            LockIN is a real-time competitive coding platform where developers
            compete in live coding battles.
          </p>

          <p className="mb-6 text-lg">
            Participants solve algorithmic challenges under time pressure,
            competing for speed, accuracy, and code quality.
          </p>

          <button
            onClick={() => {
              window.location.href = "/auth/register";
            }}
            className="bg-primary hover:opacity-90 text-white px-6 py-3 rounded-xl transition-all"
          >
            Get started →
          </button>
        </div>
      </div>
    </section>
  );
}