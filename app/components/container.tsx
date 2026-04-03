import { ReactNode } from "react"

interface ContainerProps {
  children: ReactNode
  className?: string
}

export default function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center w-full bg-gray-50 ${className}`}>
      <div className="flex flex-col gap-4 items-center justify-center grow w-full max-w-[480px] px-4">
        {children}
      </div>
    </div>
  )
}
