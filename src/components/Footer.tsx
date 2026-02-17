import { Avatar, AvatarImage, AvatarFallback, AvatarGroup } from './ui/avatar'
import Esprit from '@/../public/Logo_ESPRIT 1.svg'

export default function Footer() {
  return (
    <div className="flex border-border border-t p-4 px-20 gap-4 select-none">
      <div className="text-left flex flex-col justify-between">
        <p className="pr-32 text-left">
          <span className="font-semibold text-primary">LOCKIN</span> is a
          gamified coding ecosystem designed by
          <span className="font-semibold text-primary"> Dusk&Dawn </span>
          to transform disciplined practice into an immersive experience. By
          blending high-level algorithmic challenges with videogame-style
          progression, we help developers stay consistent, level up their
          skills, and conquer the plateau.
        </p>
        <a className="hover:underline hover:text-primary cursor-pointer">
          Privacy Policy
        </a>
      </div>
      <div className="flex flex-col gap-4">
        <AvatarGroup>
          <Avatar className="cursor-pointer">
            <a target="_blank" href="https://github.com/Oumeima-IbnElfekih">
              <AvatarImage src="https://avatars.githubusercontent.com/u/58104890?v=4" />
            </a>
            <AvatarFallback>OI</AvatarFallback>
          </Avatar>
          <Avatar className="cursor-pointer">
            <a target="_blank" href="https://github.com/drumino">
              <AvatarImage src="https://avatars.githubusercontent.com/u/123776531?v=4" />
            </a>
            <AvatarFallback>AA</AvatarFallback>
          </Avatar>
          <Avatar className="cursor-pointer">
            <a href="https://github.com/salmaaaaaaaaaaaaaaaa">
              <AvatarImage src="https://avatars.githubusercontent.com/u/131760468?v=4" />
            </a>
            <AvatarFallback>SB</AvatarFallback>
          </Avatar>
          <Avatar className="cursor-pointer">
            <a target="_blank" href="https://github.com/SlimBizid">
              <AvatarImage src="https://avatars.githubusercontent.com/u/125152034?v=4" />
            </a>
            <AvatarFallback>SB</AvatarFallback>
          </Avatar>
          <Avatar className="cursor-pointer">
            <a target="_blank" href="https://github.com/RamOfFate">
              <AvatarImage src="https://avatars.githubusercontent.com/u/257519557?v=4" />
            </a>
            <AvatarFallback>TM</AvatarFallback>
          </Avatar>
          <Avatar className="cursor-pointer">
            <a target="_blank" href="https://github.com/zeeyach">
              <AvatarImage src="https://avatars.githubusercontent.com/u/132415981?v=4" />
            </a>
            <AvatarFallback>ZA</AvatarFallback>
          </Avatar>
        </AvatarGroup>
        <a href="https://www.esprit.tn/" target="_blank">
          <img src={Esprit} className="w-40" alt="Esprit logo" />
        </a>
      </div>
    </div>
  )
}
