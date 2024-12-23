interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed = false }: LogoProps) {
  if (collapsed) {
    return (
      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">
        A
      </div>
    );
  }

  return (
    <div className="text-xl font-bold">
      AppName
    </div>
  );
} 