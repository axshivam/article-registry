import { useState } from 'react'
import { cluster, isTestNet, CLUSTER_META } from '../config'

interface OnboardingGuideProps {
  isOpen: boolean
  onClose: () => void
}

type StepId = 'install' | 'network' | 'funds' | 'connect' | 'interact'

interface Step {
  id: StepId
  title: string
  emoji: string
  lines: React.ReactNode[]
}

const meta = CLUSTER_META[cluster]

const STEPS: Step[] = [
  {
    id: 'install',
    title: 'Install a Wallet',
    emoji: '🦊',
    lines: [
      <>
        You need a <strong className="text-white">Solana browser wallet</strong> to sign transactions.
        Phantom is the most popular.
      </>,
      <>
        Download from{' '}
        <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="underline text-violet-400 hover:text-violet-300">
          phantom.app
        </a>{' '}
        (or the{' '}
        <a href="https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa" target="_blank" rel="noopener noreferrer" className="underline text-violet-400 hover:text-violet-300">
          Chrome Web Store
        </a>
        ) — it's free and takes ~1 minute.
      </>,
      <>
        Create a new wallet, save your <strong className="text-amber-300">seed phrase</strong> somewhere safe
        (never share it with anyone).
      </>,
    ],
  },
  {
    id: 'network',
    title: 'Configure Network',
    emoji: '🔗',
    lines: [
      <>
        This app runs on <strong className={meta.textColor}>{meta.label}</strong>. Your wallet
        must be set to the same network, otherwise transactions will fail.
      </>,
      ...(cluster === 'devnet'
        ? [
            <>
              <strong className="text-white">Phantom → Devnet:</strong>
            </>,
            <ol className="list-none space-y-1 mt-0.5" key="phantom-devnet-steps">
              {[
                'Open Phantom → click ≡ (top-right)',
                'Settings → Developer Settings → enable "Testnet Mode"',
                'Return to main screen → click your network name',
                'Select "Devnet"',
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[9px] flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>,
          ]
        : [
            <>Phantom defaults to Mainnet — no special steps needed.</>,
          ]),
    ],
  },
  {
    id: 'funds',
    title: 'Get Test SOL',
    emoji: '💧',
    lines: isTestNet
      ? [
          <>
            On <strong className={meta.textColor}>{meta.label}</strong> you can get free test SOL
            from the official Solana faucet.
          </>,
          <>
            Click the{' '}
            <strong className={meta.textColor}>Get SOL →</strong> button in the header, or visit{' '}
            <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="underline text-violet-400 hover:text-violet-300">
              faucet.solana.com
            </a>{' '}
            and paste your wallet address.
          </>,
          <>The faucet gives up to 5 SOL per request — more than enough for all operations.</>,
        ]
      : [
          <>On Mainnet, SOL has real monetary value — purchase it from an exchange.</>,
        ],
  },
  {
    id: 'connect',
    title: 'Connect Your Wallet',
    emoji: '🔌',
    lines: [
      <>
        Click the <strong className="text-violet-300">Select Wallet</strong> button in the top-right
        corner of the page.
      </>,
      <>Choose <strong className="text-white">Phantom</strong> (or any listed wallet).</>,
      <>The wallet extension will pop up — click <strong className="text-white">Connect</strong>.</>,
      <>
        You're in! Your wallet address and SOL balance will appear in the header.
      </>,
    ],
  },
  {
    id: 'interact',
    title: 'Interact with the App',
    emoji: '✍️',
    lines: [
      <>
        <strong className="text-white">Create an article</strong> — click "New Article", fill in a
        title (max 50 chars) and body (max 2000 chars), then confirm the transaction in your wallet.
        Each article costs a tiny amount of SOL for on-chain storage (rent).
      </>,
      <>
        <strong className="text-white">Edit an article</strong> — click the "Edit" button on any
        card. Only the body can change; the title is locked because it's part of the on-chain address
        (PDA seed).
      </>,
      <>
        <strong className="text-white">Delete an article</strong> — click "Delete" and confirm.
        The account is closed and the rent SOL is returned to your wallet.
      </>,
      <>
        Every write operation requires your wallet to sign a Solana transaction — you'll always see
        a Phantom popup asking for approval before anything is sent.
      </>,
    ],
  },
]

export function OnboardingGuide({ isOpen, onClose }: OnboardingGuideProps) {
  const [activeStep, setActiveStep] = useState<StepId>('install')

  if (!isOpen) return null

  const currentStep = STEPS.find(s => s.id === activeStep)!
  const currentIndex = STEPS.findIndex(s => s.id === activeStep)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl animate-slide-up flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Drag indicator (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sm:pt-5 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-base">
              📖
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-none">Getting Started</h2>
              <p className="text-slate-500 text-xs mt-0.5">New to blockchain? Start here.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar — step list */}
          <nav className="hidden sm:flex flex-col w-48 shrink-0 border-r border-slate-700/50 py-3 gap-1 overflow-y-auto">
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-3 text-left px-4 py-2.5 mx-2 rounded-xl transition-all text-sm ${
                  activeStep === step.id
                    ? 'bg-violet-600/20 border border-violet-500/30 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{step.emoji}</span>
                <span className="leading-tight">{step.title}</span>
              </button>
            ))}
          </nav>

          {/* Mobile step pills */}
          <div className="sm:hidden absolute top-[5.5rem] left-0 right-0 px-4 flex gap-1.5 overflow-x-auto pb-2 border-b border-slate-700/50">
            {STEPS.map(step => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeStep === step.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {step.emoji} {step.title}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto px-6 py-5 sm:py-6">
            {/* Step heading */}
            <div className="flex items-center gap-2.5 mb-5">
              <span className="text-2xl">{currentStep.emoji}</span>
              <div>
                <p className="text-slate-500 text-xs">Step {currentIndex + 1} of {STEPS.length}</p>
                <h3 className="text-white font-semibold text-lg leading-snug">{currentStep.title}</h3>
              </div>
            </div>

            {/* Step content */}
            <div className="space-y-3 text-slate-400 text-sm leading-relaxed">
              {currentStep.lines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50 shrink-0">
          <button
            onClick={() => {
              if (currentIndex > 0) setActiveStep(STEPS[currentIndex - 1].id)
            }}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-600/70 text-slate-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-default transition-all text-sm"
          >
            ← Previous
          </button>

          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`w-2 h-2 rounded-full transition-all ${
                  s.id === activeStep ? 'bg-violet-500 w-4' : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          {currentIndex < STEPS.length - 1 ? (
            <button
              onClick={() => setActiveStep(STEPS[currentIndex + 1].id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all"
            >
              Let's go! ✓
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
