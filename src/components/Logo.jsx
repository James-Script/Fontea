export default function Logo({ size = 'medium' }) {
  const sizes = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-20'
  }

  const textSizes = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-5xl'
  }

  const dotSizes = {
    small: 'w-1.5 h-1.5',
    medium: 'w-2 h-2',
    large: 'w-3 h-3'
  }

  // Cores do novo design: verde-limão (#00FF88) para texto e verde escuro (#00BFA5) para pontos
  const textColor = '#00FF88' // Verde-limão vibrante
  const dotColor = '#00BFA5' // Verde mais escuro e saturado
  const bgColor = '#B2DFDB' // Verde claro para fundo (se necessário)

  return (
    <div className={`${sizes[size]} flex items-center`}>
      <div 
        className={`${textSizes[size]} font-bold tracking-tight relative`} 
        style={{ 
          color: textColor, 
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold'
        }}
      >
        {/* F com ponto no topo esquerdo */}
        <span className="relative inline-block">
          <span 
            className={`absolute ${dotSizes[size]} rounded-full`} 
            style={{ 
              backgroundColor: dotColor, 
              top: size === 'small' ? '-2px' : size === 'medium' ? '-3px' : '-4px', 
              left: size === 'small' ? '-4px' : size === 'medium' ? '-5px' : '-6px' 
            }}
          ></span>
          F
        </span>
        {/* O sem ponto */}
        <span className="inline-block">O</span>
        {/* N sem ponto */}
        <span className="inline-block">N</span>
        {/* T sem ponto */}
        <span className="inline-block">T</span>
        {/* E com ponto no topo esquerdo */}
        <span className="relative inline-block">
          <span 
            className={`absolute ${dotSizes[size]} rounded-full`} 
            style={{ 
              backgroundColor: dotColor, 
              top: size === 'small' ? '-2px' : size === 'medium' ? '-3px' : '-4px', 
              left: size === 'small' ? '-4px' : size === 'medium' ? '-5px' : '-6px' 
            }}
          ></span>
          E
        </span>
        {/* A com ponto no inferior esquerdo */}
        <span className="relative inline-block">
          <span 
            className={`absolute ${dotSizes[size]} rounded-full`} 
            style={{ 
              backgroundColor: dotColor, 
              bottom: size === 'small' ? '-2px' : size === 'medium' ? '-3px' : '-4px', 
              left: size === 'small' ? '-4px' : size === 'medium' ? '-5px' : '-6px' 
            }}
          ></span>
          A
        </span>
      </div>
    </div>
  )
}

