import { useEffect, useMemo, useState } from 'react'

const COLORS = {
  shell: '#FBF7F2',
  ink: '#1F1830',
  stone: '#635C72',
  berry: '#7B2859',
  dusk: '#35264A',
  rose: '#F4D6E3',
  cream: '#FFFDFC',
}

const PAGE = { maxWidth: 1160, margin: '0 auto', padding: '0 28px' }
const STORAGE_KEY = 'relational-layers-site-v1'

const LAYERS = [
  { id: 'contact', label: 'Contact', description: 'You recognize each other and the bond remains untested.' },
  { id: 'warmth', label: 'Warmth', description: 'There is genuine liking and positive contact, but little shared risk.' },
  { id: 'trust', label: 'Trust', description: 'Disclosure, consistency, and follow-through are becoming real.' },
  { id: 'reliance', label: 'Reliance', description: 'You count on each other in meaningful ways and that dependence is starting to matter.' },
  { id: 'kinship', label: 'Intimacy / Kinship', description: 'This bond shapes belonging, identity, and longer-term life decisions.' },
]

const CONTEXTS = [
  { id: 'friendship', label: 'Friendship' },
  { id: 'romance', label: 'Emerging romance' },
  { id: 'community', label: 'Community connection' },
  { id: 'collaboration', label: 'Close collaboration' },
]

const DIRECTIONS = [
  { id: 'deepen', label: 'Deepen' },
  { id: 'hold', label: 'Hold' },
  { id: 'clarify', label: 'Clarify' },
  { id: 'step-back', label: 'Step back' },
]

const ACTIONS = {
  deepen: { title: 'Proceed carefully toward the next layer', badge: 'Deepen', color: '#EEE2F9', accent: '#5A2B87' },
  hold: { title: 'Hold the current layer and stabilize it', badge: 'Hold', color: '#ECE8FB', accent: '#3E3D8D' },
  clarify: { title: 'Clarify the bond before investing further', badge: 'Clarify', color: '#FFF0E4', accent: '#A15A1B' },
  'step-back': { title: 'Protect energy and reduce intensity', badge: 'Step back', color: '#F8E4EA', accent: '#8B3658' },
}

const DEFAULT_STATE = {
  context: 'friendship',
  layer: 'warmth',
  direction: 'deepen',
  reciprocity: 4,
  safety: 4,
  pace: 3,
  repair: 3,
  boundaries: 4,
  desire: 4,
  notes: '',
}

function loadSession() {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    return raw ? { ...DEFAULT_STATE, ...raw } : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

function nextLayer(currentLayerId) {
  const index = LAYERS.findIndex((layer) => layer.id === currentLayerId)
  return LAYERS[Math.min(index + 1, LAYERS.length - 1)]
}

function scoreAverage(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildPlan({ context, layer, direction, reciprocity, safety, pace, repair, boundaries, desire }) {
  const metrics = { reciprocity, safety, pace, repair, boundaries, desire }
  const lowest = Math.min(reciprocity, safety, pace, repair, boundaries, desire)
  const avg = scoreAverage(Object.values(metrics))
  const current = LAYERS.find((item) => item.id === layer)
  const upcoming = nextLayer(layer)
  const contextLabel = CONTEXTS.find((item) => item.id === context)?.label ?? 'relationship'

  let action = direction
  let why = ''

  if (direction === 'step-back' || desire <= 2) {
    action = 'step-back'
    why = 'Your own desire is low enough that more depth would likely come from momentum, guilt, or ambiguity.'
  } else if (safety <= 2 || boundaries <= 2) {
    action = 'step-back'
    why = 'Safety or boundary clarity is too weak for more intensity. Protection comes before a better conversation.'
  } else if (reciprocity <= 2 || repair <= 2) {
    action = 'clarify'
    why = 'The bond may feel meaningful. Reciprocity or repair is still too weak to support deeper investment without a direct reality check.'
  } else if (direction === 'deepen' && avg >= 4 && lowest >= 3) {
    action = 'deepen'
    why = `The bond appears strong enough to test movement from ${current.label.toLowerCase()} toward ${upcoming.label.toLowerCase()} if both people genuinely want that.`
  } else if (direction === 'hold' || pace <= 3) {
    action = 'hold'
    why = 'The relationship may be healthy. The pacing signals do not support acceleration yet.'
  } else {
    action = 'clarify'
    why = 'There is enough signal to continue. Clear expectations still need to be named before the bond can deepen cleanly.'
  }

  const outputs = {
    deepen: {
      nextRequirement: `To move from ${current.label.toLowerCase()} toward ${upcoming.label.toLowerCase()}, both people need stronger explicitness around time, reciprocity, and what each person is actually offering.`,
      prompt: `I like where this ${contextLabel.toLowerCase()} is going. Would you want to be a little more intentional about it, or would you rather keep it where it is?`,
      practice: 'Make one slightly higher-stakes bid: more time, more honesty, or one real ask. Then watch whether the response is reciprocal and calm.',
      greenFlag: 'The other person responds with clarity and warmth.',
      stopCondition: 'If you have to drag the bond forward through guesswork, stop escalating.',
    },
    hold: {
      nextRequirement: 'The current layer needs repetition and stability before it needs more depth. Let consistency do more of the work.',
      prompt: 'I value what we already have. Does this pace feel right to you too?',
      practice: 'Repeat the current pattern long enough to see whether trust grows on its own without pressure.',
      greenFlag: 'Contact stays warm and consistent without either person forcing intensity.',
      stopCondition: 'If holding turns into chronic ambiguity that drains you, move to clarify instead.',
    },
    clarify: {
      nextRequirement: 'Before anything deepens, the ambiguity has to shrink. The task is naming the relationship more honestly than either person has so far.',
      prompt: 'I want to check what this is becoming for each of us so neither of us fills in the gaps with guesses.',
      practice: 'Ask one direct question about expectations, availability, or boundaries and resist the urge to soften it into vagueness.',
      greenFlag: 'The answer is specific enough to guide behavior.',
      stopCondition: 'If clarity repeatedly collapses into deflection, stop investing more here.',
    },
    'step-back': {
      nextRequirement: 'The next healthy step is a cleaner structure. Reduce intensity until your energy, boundaries, and reality line up again.',
      prompt: safety <= 2 ? 'If the dynamic feels unsafe, create distance first. A full processing conversation can wait.' : 'I need to slow this down and keep it in a lighter lane for now.',
      practice: 'Shrink access: less immediacy, fewer emotionally loaded exchanges, and no deeper bids until the bond feels safe again.',
      greenFlag: 'Distance creates relief rather than panic.',
      stopCondition: 'If stepping back does not restore clarity or safety, exit the pattern more fully.',
    },
  }

  return { action, why, ...outputs[action] }
}

function buildGuardrails({ safety, boundaries, notes }) {
  const items = [
    'Base the read on observable behavior. Drop motive stories and imagined hidden meanings.',
    'Use this tool for your own discernment.',
    'Rewrite any generated wording until it sounds like something you would actually say.',
  ]

  if (safety <= 2 || boundaries <= 2) {
    items.unshift('If the situation includes coercion, fear, intimidation, stalking, or volatility, prioritize distance, trusted support, and concrete safety choices.')
  }

  if (notes.trim().length === 0) {
    items.push('Write down concrete events before trusting the output. Specific moments beat global vibes.')
  }

  return items
}

function FeedbackForm({ session }) {
  const [form, setForm] = useState({ name: '', email: '', notes: '' })
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const onChange = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const onSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, session }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save feedback.')
      setStatus('success')
      setMessage('Saved. This will shape the next product pass.')
      setForm((current) => ({ ...current, notes: '' }))
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unable to save feedback.')
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input value={form.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Name" style={inputStyle} required />
        <input value={form.email} onChange={(event) => onChange('email', event.target.value)} placeholder="Email" type="email" style={inputStyle} required />
      </div>
      <textarea value={form.notes} onChange={(event) => onChange('notes', event.target.value)} placeholder="What worked, what felt off, and what this tool should help with next" style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} required />
      <button type="submit" disabled={status === 'loading'} style={{ ...buttonStyle, opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? 'Saving...' : 'Send feedback'}
      </button>
      {message ? <p style={{ color: status === 'error' ? '#8F2C2C' : COLORS.stone, lineHeight: 1.7 }}>{message}</p> : null}
    </form>
  )
}

export default function App() {
  const [session, setSession] = useState(loadSession)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }, [session])

  const plan = useMemo(() => buildPlan(session), [session])
  const guardrails = useMemo(() => buildGuardrails(session), [session])
  const actionMeta = ACTIONS[plan.action]

  const update = (key, value) => setSession((current) => ({ ...current, [key]: value }))
  const reset = () => setSession(DEFAULT_STATE)

  return (
    <div style={{ background: COLORS.shell, color: COLORS.ink, minHeight: '100vh' }}>
      <section style={{ background: `linear-gradient(145deg, ${COLORS.rose} 0%, #F3EAF7 48%, #E5E8F8 100%)`, padding: '96px 0 72px', borderBottom: '1px solid rgba(31,24,48,0.08)' }}>
        <div style={PAGE}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 28, alignItems: 'end' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: COLORS.berry, marginBottom: 18 }}>
                Relational Layers
              </p>
              <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5.2rem)', lineHeight: 0.95, marginBottom: 20 }}>
                Name the bond.
                <br />
                Choose the next move.
              </h1>
              <p style={{ fontSize: '1.15rem', lineHeight: 1.8, maxWidth: 640, color: COLORS.dusk }}>
                Relational Layers helps a person decide whether to deepen, hold, clarify, or step back. The model stays narrow, keeps the read tied to observable behavior, and stores the session on the device.
              </p>
            </div>
            <div style={{ background: 'rgba(255,253,252,0.92)', borderRadius: 24, padding: 24, boxShadow: '0 18px 40px rgba(53,38,74,0.10)' }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <SelectField label="Context" value={session.context} onChange={(value) => update('context', value)} options={CONTEXTS} />
                <SelectField label="Current layer" value={session.layer} onChange={(value) => update('layer', value)} options={LAYERS.map((item) => ({ id: item.id, label: item.label }))} />
                <SelectField label="Desired direction" value={session.direction} onChange={(value) => update('direction', value)} options={DIRECTIONS} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <p style={{ color: COLORS.stone, fontSize: '0.92rem', lineHeight: 1.6 }}>Session is saved locally on this device.</p>
                <button type="button" onClick={reset} style={resetButtonStyle}>Reset session</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '34px 0 72px' }}>
        <div style={PAGE}>
          <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 22, alignItems: 'start' }}>
            <div style={panelStyle}>
              <h2 style={{ fontSize: '1.6rem', marginBottom: 18 }}>Readiness signals</h2>
              <div style={{ display: 'grid', gap: 18 }}>
                <SliderField label="Reciprocity" value={session.reciprocity} setValue={(value) => update('reciprocity', value)} help="Is care flowing both ways?" />
                <SliderField label="Safety" value={session.safety} setValue={(value) => update('safety', value)} help="Do you feel grounded rather than destabilized in this bond?" />
                <SliderField label="Pace alignment" value={session.pace} setValue={(value) => update('pace', value)} help="Are both people moving at a similar speed?" />
                <SliderField label="Repair capacity" value={session.repair} setValue={(value) => update('repair', value)} help="Can tension be named and repaired without shutdown or chaos?" />
                <SliderField label="Boundary clarity" value={session.boundaries} setValue={(value) => update('boundaries', value)} help="Can limits be expressed without punishment or fog?" />
                <SliderField label="Your actual desire" value={session.desire} setValue={(value) => update('desire', value)} help="Do you truly want more depth, or are you following momentum?" />
              </div>
              <div style={{ marginTop: 22 }}>
                <div style={fieldLabelStyle}>Observable notes</div>
                <textarea value={session.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Write what has actually happened: follow-through, missed bids, direct statements, repair attempts, boundary tests..." style={textareaStyle} />
                <p style={{ color: COLORS.stone, fontSize: '0.92rem', lineHeight: 1.6, marginTop: 8 }}>
                  Use this for facts. Concrete moments and repeatable patterns are the best inputs.
                </p>
              </div>
            </div>
            <div style={panelStyle}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, borderRadius: 999, background: actionMeta.color, color: actionMeta.accent, padding: '10px 14px', fontFamily: 'var(--font-display)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
                Recommended lane: {actionMeta.badge}
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: 12 }}>{actionMeta.title}</h2>
              <p style={{ color: COLORS.dusk, lineHeight: 1.8, marginBottom: 22 }}>{plan.why}</p>
              <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <InsightCard title="What the next layer requires" body={plan.nextRequirement} />
                <InsightCard title="Suggested wording" body={plan.prompt} />
                <InsightCard title="Suggested practice" body={plan.practice} />
                <InsightCard title="Green flag to watch" body={plan.greenFlag} />
              </div>
              <div style={{ marginTop: 16, borderRadius: 22, background: '#F6F1F8', padding: 18, border: '1px solid rgba(31,24,48,0.08)' }}>
                <div style={cardLabelStyle}>Stopping condition</div>
                <p style={{ marginTop: 10, lineHeight: 1.8 }}>{plan.stopCondition}</p>
              </div>
            </div>
          </div>

          <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 22, marginTop: 22 }}>
            <div style={panelStyle}>
              <h2 style={{ fontSize: '1.45rem', marginBottom: 14 }}>Guardrails</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {guardrails.map((item) => (
                  <div key={item} style={{ borderRadius: 18, background: '#FFF7FB', border: '1px solid rgba(123,40,89,0.10)', padding: 16 }}>
                    <p style={{ lineHeight: 1.75 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={panelStyle}>
              <h2 style={{ fontSize: '1.45rem', marginBottom: 14 }}>Out of scope</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  'diagnosing attachment style or trauma',
                  'deciding who is right in a conflict',
                  'proving what the other person secretly feels',
                  'situations involving active coercion, threats, or fear',
                ].map((item) => (
                  <div key={item} style={{ borderRadius: 18, background: '#FAF2F5', border: '1px solid rgba(31,24,48,0.08)', padding: 16 }}>
                    <p style={{ lineHeight: 1.75 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 22 }} className="layer-strip">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }} className="layer-strip">
              {LAYERS.map((item) => (
                <div key={item.id} style={{ borderRadius: 20, padding: 18, background: item.id === session.layer ? '#F4DCE8' : COLORS.cream, border: item.id === session.layer ? `1px solid ${COLORS.berry}` : '1px solid rgba(31,24,48,0.08)' }}>
                  <div style={cardLabelStyle}>{item.label}</div>
                  <p style={{ marginTop: 10, color: COLORS.stone, lineHeight: 1.7 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 22 }}>
            <div style={panelStyle}>
              <h2 style={{ fontSize: '1.45rem', marginBottom: 12 }}>Feedback</h2>
              <p style={{ color: COLORS.stone, lineHeight: 1.75, marginBottom: 18 }}>
                Send notes about what helped, what felt risky, and where the model needs more structure.
              </p>
              <FeedbackForm session={session} />
            </div>
            <div style={panelStyle}>
              <h2 style={{ fontSize: '1.45rem', marginBottom: 12 }}>Why this site exists</h2>
              <p style={{ color: COLORS.stone, lineHeight: 1.82 }}>
                Many relationship tools reward projection, ambiguity, or faux depth. Relational Layers is built to help a person make cleaner choices with a narrower and more accountable model.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label>
      <div style={fieldLabelStyle}>{label}</div>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={selectStyle}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function SliderField({ label, value, setValue, help }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
        <div style={fieldLabelStyle}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', color: COLORS.berry }}>{value} / 5</div>
      </div>
      <input type="range" min="1" max="5" step="1" value={value} onChange={(event) => setValue(Number(event.target.value))} style={{ width: '100%', accentColor: COLORS.berry }} />
      <p style={{ color: COLORS.stone, fontSize: '0.92rem', lineHeight: 1.6, marginTop: 8 }}>{help}</p>
    </div>
  )
}

function InsightCard({ title, body }) {
  return (
    <div style={{ borderRadius: 20, background: COLORS.cream, padding: 18, border: '1px solid rgba(31,24,48,0.08)' }}>
      <div style={cardLabelStyle}>{title}</div>
      <p style={{ marginTop: 10, lineHeight: 1.8 }}>{body}</p>
    </div>
  )
}

const panelStyle = {
  background: '#FFFCFA',
  borderRadius: 24,
  padding: 24,
  border: '1px solid rgba(31,24,48,0.08)',
  boxShadow: '0 18px 40px rgba(31,24,48,0.04)',
}

const fieldLabelStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.78rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: COLORS.berry,
}

const cardLabelStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.78rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: COLORS.berry,
}

const selectStyle = {
  width: '100%',
  marginTop: 8,
  border: '1px solid rgba(31,24,48,0.12)',
  borderRadius: 14,
  padding: '14px 16px',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  background: '#fff',
  color: COLORS.ink,
}

const textareaStyle = {
  width: '100%',
  minHeight: 140,
  marginTop: 8,
  border: '1px solid rgba(31,24,48,0.12)',
  borderRadius: 14,
  padding: '14px 16px',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  background: '#fff',
  color: COLORS.ink,
  resize: 'vertical',
}

const inputStyle = {
  width: '100%',
  border: '1px solid rgba(31,24,48,0.12)',
  borderRadius: 14,
  background: '#fff',
  padding: '14px 16px',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  color: COLORS.ink,
}

const buttonStyle = {
  width: '100%',
  border: 'none',
  borderRadius: 16,
  background: COLORS.ink,
  color: '#fff',
  padding: '14px 18px',
  fontFamily: 'var(--font-display)',
  fontSize: '0.96rem',
  cursor: 'pointer',
}

const resetButtonStyle = {
  border: '1px solid rgba(31,24,48,0.12)',
  borderRadius: 999,
  padding: '8px 12px',
  background: '#fff',
  color: COLORS.ink,
  fontFamily: 'var(--font-display)',
  cursor: 'pointer',
}
