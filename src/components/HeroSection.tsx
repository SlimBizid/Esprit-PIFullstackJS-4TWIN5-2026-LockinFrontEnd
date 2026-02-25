import PixelSword from '@/../public/pixel sword.jpg'
import Editor from '@/../public/editor.png'

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[80vh] py-32 flex flex-col items-center justify-center pt-20 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-10 pointer-events-none ">
        <img src={PixelSword} className="w-full object-cover" alt="" />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none bg-linear-to-t from-background from-20% to-50% to-emerald-300/0 z-20 "></div>

      <div className="relative z-30 text-center px-6 max-w-5xl">
        <h1 className="text-5xl md:text-7xl mb-6 tracking-tight bg-linear-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
          LOCK IN_ <br />
          <span className="text-primary">By Dusk&Dawn.</span>
        </h1>

        <p className="text-foreground text-lg md:text-xl max-w-2xl mx-auto ">
          Stop gaming. Start building. The competitive arena for programmers who
          lack discipline but love the grind.
        </p>
      </div>

      <div className="relative rounded-2xl  mx-32 shadow-2xl z-10 mt-20 border-2 overflow-hidden">
        {/* <div className="absolute inset-0 z-10 bg-gray-950" /> */}
        <img
          src={Editor}
          alt="ByteBattle Preview"
          className="w-full h-auto  object-cover aspect-video"
        />
      </div>
    </section>
  )
}
