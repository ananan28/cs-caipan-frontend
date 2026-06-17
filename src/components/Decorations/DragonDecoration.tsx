export function DragonDecoration() {
  return (
    <div className="pointer-events-none select-none opacity-40">
      <svg viewBox="0 0 400 400" className="w-96 h-96" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 龙身主体 - 蓝色渐变 */}
        <path d="M200 30 C240 50, 280 40, 300 70 C320 100, 280 140, 240 120 C200 100, 220 60, 200 30Z" 
          fill="url(#dragonBody)" opacity="0.7"/>
        <path d="M200 30 C160 50, 120 40, 100 70 C80 100, 120 140, 160 120 C200 100, 180 60, 200 30Z" 
          fill="url(#dragonBody2)" opacity="0.7"/>
        
        {/* 龙鳞 - 菱形纹路 */}
        <g opacity="0.3" stroke="#60a5fa" strokeWidth="1.2">
          <path d="M170 55 L190 70 L210 55 L190 40 Z"/>
          <path d="M155 80 L175 95 L195 80 L175 65 Z"/>
          <path d="M140 105 L160 120 L180 105 L160 90 Z"/>
          <path d="M125 130 L145 145 L165 130 L145 115 Z"/>
          <path d="M230 55 L210 70 L190 55 L210 40 Z"/>
          <path d="M245 80 L225 95 L205 80 L225 65 Z"/>
          <path d="M260 105 L240 120 L220 105 L240 90 Z"/>
          <path d="M275 130 L255 145 L235 130 L255 115 Z"/>
        </g>
        
        {/* 龙脊 - 背刺 */}
        <g fill="#3b82f6" opacity="0.5">
          <path d="M190 35 L180 15 L200 30 Z"/>
          <path d="M210 35 L220 15 L200 30 Z"/>
          <path d="M175 50 L160 30 L185 45 Z"/>
          <path d="M225 50 L240 30 L215 45 Z"/>
          <path d="M160 65 L140 45 L170 60 Z"/>
          <path d="M240 65 L260 45 L230 60 Z"/>
        </g>
        
        {/* 龙爪 - 左前爪 */}
        <path d="M80 130 C60 150, 40 160, 30 150 C25 145, 35 135, 50 125 L80 130Z" 
          fill="url(#clawGrad)" opacity="0.6"/>
        <path d="M70 145 C50 165, 30 175, 20 165 C15 160, 25 150, 40 140 L70 145Z" 
          fill="url(#clawGrad)" opacity="0.5"/>
        <path d="M60 160 C40 180, 20 190, 10 180 C5 175, 15 165, 30 155 L60 160Z" 
          fill="url(#clawGrad)" opacity="0.4"/>
        
        {/* 龙爪 - 右前爪 */}
        <path d="M320 130 C340 150, 360 160, 370 150 C375 145, 365 135, 350 125 L320 130Z" 
          fill="url(#clawGrad)" opacity="0.6"/>
        <path d="M330 145 C350 165, 370 175, 380 165 C385 160, 375 150, 360 140 L330 145Z" 
          fill="url(#clawGrad)" opacity="0.5"/>
        <path d="M340 160 C360 180, 380 190, 390 180 C395 175, 385 165, 370 155 L340 160Z" 
          fill="url(#clawGrad)" opacity="0.4"/>
        
        {/* 龙尾 */}
        <path d="M160 150 C130 190, 90 220, 110 260 C130 290, 170 270, 155 240 C140 210, 155 180, 160 150Z" 
          fill="url(#tailGrad)" opacity="0.5"/>
        <path d="M240 150 C270 190, 310 220, 290 260 C270 290, 230 270, 245 240 C260 210, 245 180, 240 150Z" 
          fill="url(#tailGrad)" opacity="0.5"/>
        
        {/* 龙尾火焰 */}
        <path d="M110 260 C100 280, 80 290, 90 300 C100 310, 120 300, 115 280 L110 260Z" 
          fill="#60a5fa" opacity="0.3"/>
        <path d="M290 260 C300 280, 320 290, 310 300 C300 310, 280 300, 285 280 L290 260Z" 
          fill="#60a5fa" opacity="0.3"/>
        
        {/* 龙角 */}
        <path d="M180 35 L160 5 L175 20 L165 0 L185 25" stroke="#93c5fd" strokeWidth="2.5" opacity="0.6"/>
        <path d="M220 35 L240 5 L225 20 L235 0 L215 25" stroke="#93c5fd" strokeWidth="2.5" opacity="0.6"/>
        
        {/* 龙眼 - 发光 */}
        <ellipse cx="185" cy="55" rx="8" ry="6" fill="#93c5fd" opacity="0.9"/>
        <ellipse cx="185" cy="55" rx="4" ry="4" fill="#1e3a8a"/>
        <ellipse cx="185" cy="53" rx="2" ry="2" fill="#ffffff" opacity="0.8"/>
        
        <ellipse cx="215" cy="55" rx="8" ry="6" fill="#93c5fd" opacity="0.9"/>
        <ellipse cx="215" cy="55" rx="4" ry="4" fill="#1e3a8a"/>
        <ellipse cx="215" cy="53" rx="2" ry="2" fill="#ffffff" opacity="0.8"/>
        
        {/* 龙须 */}
        <path d="M170 65 C140 80, 110 85, 100 75" stroke="#60a5fa" strokeWidth="1.8" opacity="0.5"/>
        <path d="M175 75 C150 95, 120 100, 105 90" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4"/>
        <path d="M230 65 C260 80, 290 85, 300 75" stroke="#60a5fa" strokeWidth="1.8" opacity="0.5"/>
        <path d="M225 75 C250 95, 280 100, 295 90" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4"/>
        
        {/* 龙珠 - 发光 */}
        <circle cx="200" cy="160" r="18" fill="url(#pearlGrad)" opacity="0.5"/>
        <circle cx="200" cy="160" r="10" fill="url(#pearlGrad)" opacity="0.7"/>
        <circle cx="200" cy="160" r="5" fill="#93c5fd" opacity="0.9"/>
        <circle cx="198" cy="157" r="2" fill="#ffffff" opacity="0.8"/>
        
        {/* 龙珠光晕 */}
        <circle cx="200" cy="160" r="30" fill="#3b82f6" opacity="0.1"/>
        <circle cx="200" cy="160" r="45" fill="#3b82f6" opacity="0.05"/>
        
        {/* 龙身发光线条 */}
        <path d="M160 40 C180 50, 200 50, 220 40" stroke="#93c5fd" strokeWidth="1" opacity="0.3"/>
        <path d="M140 70 C160 80, 240 80, 260 70" stroke="#93c5fd" strokeWidth="1" opacity="0.3"/>
        
        {/* 渐变定义 */}
        <defs>
          <linearGradient id="dragonBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="30%" stopColor="#2563eb" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="dragonBody2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="clawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="tailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <radialGradient id="pearlGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="30%" stopColor="#60a5fa" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

export function DragonBorder() {
  return (
    <div className="flex items-center justify-center gap-3 py-2 pointer-events-none select-none">
      <span className="text-primary-500/20 text-xs tracking-[0.5em]">◆ ◇ ◆ ◇ ◆</span>
      <span className="text-primary-400/30 text-sm">🐉</span>
      <span className="text-primary-500/20 text-xs tracking-[0.5em]">◆ ◇ ◆ ◇ ◆</span>
    </div>
  );
}
