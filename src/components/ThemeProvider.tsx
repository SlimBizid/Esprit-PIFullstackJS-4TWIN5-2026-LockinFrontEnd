import { ThemeProvider as DaddyThemeProvider } from "next-themes";

export function ThemeProvider({children, ...props}: React.ComponentProps<typeof DaddyThemeProvider>){
    return <DaddyThemeProvider { ...props}>{children}</DaddyThemeProvider>
}