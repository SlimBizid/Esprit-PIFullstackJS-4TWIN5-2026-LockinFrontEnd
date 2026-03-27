import PixelSword from '@/../public/pixel sword.jpg'
import Editor from '@/../public/editor.png'
import EditorLight from '@/../public/editor-light.png'
import { useTheme } from 'next-themes'

export default function HeroSection() {
  const { theme } = useTheme()

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative w-full min-h-[80vh] py-32 flex flex-col items-center justify-center pt-20 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-10 pointer-events-none"
      >
        <img src={PixelSword} className="w-full object-cover" alt="" />
      </div>

      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none bg-gradient-to-t from-background from-20% to-emerald-300/0 to-50% z-20"
      />

      <div className="relative z-30 text-center px-4 sm:px-6 max-w-5xl space-y-4 pt-16">
        <h1
          id="hero-heading"
          className="text-5xl sm:text-6xl md:text-7xl mb-4 tracking-tight text-foreground leading-none"
        >
          LOCK IN
          <span className="text-primary animate-peekaboo" aria-hidden="true">
            _
          </span>
        </h1>

        <p className="text-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
          Stop gaming. Start building. The competitive arena for programmers who
          lack discipline but love the grind.
        </p>
      </div>

      <div className="relative rounded-2xl mx-4 sm:mx-8 md:mx-16 lg:mx-32 shadow-2xl z-10 mt-16 sm:mt-20 border-2 overflow-hidden w-[calc(100%-2rem)] sm:w-auto">
        <img
          src={theme === 'dark' ? Editor : EditorLight}
          alt="LockIN code editor interface preview showing a challenge in progress"
          className="w-full h-auto object-cover aspect-video"
        />
      </div>
    </section>
  )
}
