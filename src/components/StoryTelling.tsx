import { Link } from '@tanstack/react-router'

export default function StoryTelling() {
  return (
    <section className="bg-background text-foreground py-20">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">

        {/* Left Side - Purple Image Placeholder */}
        <div className="w-full md:w-1/2">
          <div className="bg-purple-500 h-72 rounded-2xl"></div>
        </div>

        {/* Right Side - Text Content */}
        <div className="w-full md:w-1/2">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            What is LockIN?
          </h2>

          <p className="mb-4 text-lg">
            LockIN is a real-time competitive coding platform where developers
            face off in live coding battles.
          </p>

          <p className="mb-6 text-lg">
            Participants solve algorithmic and programming challenges under time
            pressure, competing for speed, accuracy, and code quality.
          </p>

          <Link
            to="/auth/register"
            className="inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl transition"
          >
            Get started →
          </Link>

        </div>
      </div>
    </section>
  )
}
