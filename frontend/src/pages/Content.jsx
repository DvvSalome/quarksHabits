import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  FileText, Sparkles, Loader2, Star, Trash2, Copy, Check,
  RefreshCw, AlertCircle, Twitter, Linkedin, Mail, Video, BookOpen, Send,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { CONTENT_TEMPLATES } from '../lib/contentTemplates'
import { aiText } from '../lib/aiClient'
import { useAuth } from '../contexts/AuthContext'

const TEMPLATE_ICONS = {
  twitter: Twitter,
  linkedin: Linkedin,
  newsletter: Mail,
  email: Send,
  video: Video,
  blog: BookOpen,
}

function readAiConfig() {
  const provider = localStorage.getItem('ai_provider') || 'openrouter'
  const apiKey = provider === 'gemini'
    ? localStorage.getItem('ai_gemini_key')
    : localStorage.getItem('ai_api_key')
  const model = provider === 'gemini'
    ? localStorage.getItem('ai_gemini_model')
    : localStorage.getItem('ai_model')
  return { provider, apiKey, model }
}

function ContentItem({ item, onSelect, onDelete, onToggleStar, selected }) {
  const Icon = TEMPLATE_ICONS[item.templateType] || FileText
  return (
    <button
      onClick={() => onSelect(item)}
      className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left group ${
        selected
          ? 'bg-cyan-900/30 border-cyan-500/50 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)] glow-border'
          : 'bg-slate-900/40 border-cyan-900/30 hover:border-cyan-500/30 hover:bg-cyan-900/20'
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${selected ? 'text-cyan-400 glow-text' : 'text-cyan-600 group-hover:text-cyan-400'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${selected ? 'text-cyan-50 glow-text' : 'text-cyan-100 group-hover:text-cyan-50'}`}>{item.topic}</p>
        <p className="text-[10px] font-mono tracking-widest uppercase text-cyan-600/70 mt-1">
          {format(parseISO(item.createdAt), "d 'de' MMM, HH:mm", { locale: es })}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleStar(item) }}
          className="p-1.5 rounded hover:bg-cyan-900/50 transition-colors"
        >
          <Star className={`w-3.5 h-3.5 ${item.starred ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 'text-slate-600'}`} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
          className="p-1.5 rounded hover:bg-red-950/50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-600 hover:text-red-400" />
        </button>
      </div>
    </button>
  )
}

export default function Content() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState(null)

  // Form state
  const [templateType, setTemplateType] = useState('twitter')
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Repurpose
  const [repurposeOpen, setRepurposeOpen] = useState(false)
  const [repurposing, setRepurposing] = useState(false)
  const [repurposeTarget, setRepurposeTarget] = useState('linkedin')

  useEffect(() => {
    loadTemplates()
    loadHistory()
  }, [])

  const loadTemplates = async () => {
    setTemplates(CONTENT_TEMPLATES)
  }

  const loadHistory = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('Content')
        .select('*')
        .order('createdAt', { ascending: false })
      if (queryError) throw queryError
      setHistory(data || [])
    } catch {}
  }

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Enter a topic first')
      return
    }
    const { apiKey, model, provider } = readAiConfig()
    if (!apiKey || !model) {
      setError('Configure API Key in Settings')
      return
    }

    setGenerating(true)
    setError('')
    setGeneratedContent('')
    try {
      const content = await aiText({
        provider,
        apiKey,
        model,
        systemPrompt: 'Eres un redactor experto. Devuelve solo el contenido final, sin explicaciones extra.',
        userPrompt: `Genera contenido en formato "${templateType}" sobre: "${topic.trim()}". Audiencia: "${audience.trim() || 'general'}". Tono: "${tone.trim() || 'neutral'}".`,
      })
      setGeneratedContent(content)

      // Save to history automatically
      const { data: saved, error: saveError } = await supabase
        .from('Content')
        .insert({
          userId: user.id,
        templateType,
        topic: topic.trim(),
        audience: audience.trim() || null,
        tone: tone.trim() || null,
          body: content,
        })
        .select()
        .single()
      if (saveError) throw saveError
      setHistory((prev) => [saved, ...prev])
      setSelected(saved)
    } catch (err) {
      setError(err.message || 'Unknown Error')
    } finally {
      setGenerating(false)
    }
  }

  const handleSelect = (item) => {
    setSelected(item)
    setGeneratedContent(item.body)
    setTemplateType(item.templateType)
    setTopic(item.topic)
    setAudience(item.audience || '')
    setTone(item.tone || '')
    setError('')
  }

  const handleDelete = async (id) => {
    try {
      const { error: deleteError } = await supabase.from('Content').delete().eq('id', id)
      if (deleteError) throw deleteError
      setHistory((prev) => prev.filter((c) => c.id !== id))
      if (selected?.id === id) {
        setSelected(null)
        setGeneratedContent('')
      }
      toast.success('System updated: Record purged')
    } catch {
      toast.error('Error deleting record')
    }
  }

  const handleToggleStar = async (item) => {
    try {
      const { data: updated, error: updateError } = await supabase
        .from('Content')
        .update({ starred: !item.starred })
        .eq('id', item.id)
        .select()
        .single()
      if (updateError) throw updateError
      setHistory((prev) =>
        prev.map((c) => (c.id === item.id ? updated : c))
          .sort((a, b) => {
            if (a.starred !== b.starred) return b.starred - a.starred
            return new Date(b.createdAt) - new Date(a.createdAt)
          })
      )
    } catch {}
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent)
      setCopied(true)
      toast.success('Data copied to buffer')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Buffer copy failed')
    }
  }

  const handleSaveEdit = async () => {
    if (!selected) return
    try {
      const { data: updated, error: updateError } = await supabase
        .from('Content')
        .update({ body: generatedContent })
        .eq('id', selected.id)
        .select()
        .single()
      if (updateError) throw updateError
      setHistory((prev) => prev.map((c) => (c.id === selected.id ? updated : c)))
      toast.success('Modifications committed')
    } catch {
      toast.error('Commit failed')
    }
  }

  const handleRepurpose = async () => {
    if (!generatedContent) return
    const { apiKey, model, provider } = readAiConfig()
    if (!apiKey || !model) {
      setError('Configure API Key')
      return
    }
    setRepurposing(true)
    try {
      const content = await aiText({
        provider,
        apiKey,
        model,
        systemPrompt: 'Transforma contenido entre formatos. Devuelve solo contenido final.',
        userPrompt: `Transforma este contenido al formato "${repurposeTarget}":\n\n${generatedContent}`,
      })
      setGeneratedContent(content)
      setTemplateType(repurposeTarget)

      const { data: saved, error: saveError } = await supabase
        .from('Content')
        .insert({
          userId: user.id,
        templateType: repurposeTarget,
        topic: selected?.topic || topic || 'Repurposed',
          body: content,
        })
        .select()
        .single()
      if (saveError) throw saveError
      setHistory((prev) => [saved, ...prev])
      setSelected(saved)
      setRepurposeOpen(false)
      toast.success('Content repurposed successfully')
    } catch (err) {
      setError(err.message)
    } finally {
      setRepurposing(false)
    }
  }

  const wordCount = generatedContent.trim().split(/\s+/).filter(Boolean).length
  const charCount = generatedContent.length

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-cyan-50 flex items-center gap-3 glow-text uppercase">
          <FileText className="w-8 h-8 text-cyan-400" />
          Data Generator
        </h1>
        <p className="text-sm text-cyan-400/60 mt-1 font-mono uppercase tracking-widest">
          AI CONTENT SYNTHESIS TERMINAL
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card title="SYNTHESIZE NEW">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-mono tracking-widest text-cyan-500 uppercase mb-1 block">Output Format</label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-cyan-900/50 rounded-xl text-sm focus:outline-none focus:border-cyan-400 bg-slate-900/50 text-cyan-100 font-mono transition-colors"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900">{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-cyan-500 uppercase mb-1 block">Subject Matter *</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="> Enter data topic..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-cyan-900/50 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] bg-slate-900/50 text-cyan-100 font-mono resize-none transition-all placeholder:text-cyan-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-cyan-500 uppercase mb-1 block">Target Demographic</label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="> e.g. Developers"
                  className="w-full px-3 py-2.5 border border-cyan-900/50 rounded-xl text-sm focus:outline-none focus:border-cyan-400 bg-slate-900/50 text-cyan-100 font-mono placeholder:text-cyan-800 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-cyan-500 uppercase mb-1 block">Vocal Tone</label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="> e.g. Professional"
                  className="w-full px-3 py-2.5 border border-cyan-900/50 rounded-xl text-sm focus:outline-none focus:border-cyan-400 bg-slate-900/50 text-cyan-100 font-mono placeholder:text-cyan-800 transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-950/30 border border-red-500/30 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-mono text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 bg-cyan-900/30 border border-cyan-500/50 text-cyan-300 font-mono uppercase tracking-widest text-sm rounded-xl hover:bg-cyan-800/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 glow-border"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
                {generating ? 'PROCESSING...' : 'EXECUTE GENERATION'}
              </button>
            </div>
          </Card>

          {/* History */}
          {history.length > 0 && (
            <Card title="DATA ARCHIVES">
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                {history.map((item) => (
                  <ContentItem
                    key={item.id}
                    item={item}
                    selected={selected?.id === item.id}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    onToggleStar={handleToggleStar}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Output column */}
        <div className="lg:col-span-2">
          {generatedContent ? (
            <Card title="OUTPUT BUFFER">
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap border-b border-cyan-900/50 pb-4">
                <div>
                  <h3 className="text-sm font-mono text-cyan-300 uppercase tracking-widest">
                    {templates.find((t) => t.id === templateType)?.label || 'DATA'}
                  </h3>
                  <p className="text-[10px] font-mono text-cyan-600 mt-1 uppercase">
                    {wordCount} words // {charCount} bytes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRepurposeOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800/50 border border-cyan-900/50 text-xs font-mono uppercase text-cyan-400 hover:bg-cyan-900/30 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Transform
                  </button>
                  {selected && (
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800/50 border border-cyan-900/50 text-xs font-mono uppercase text-cyan-400 hover:bg-cyan-900/30 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      Commit
                    </button>
                  )}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-900/40 border border-cyan-500/50 text-xs font-mono uppercase text-cyan-100 hover:bg-cyan-800/60 transition-colors glow-border"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'COPIED' : 'COPY DATA'}
                  </button>
                </div>
              </div>

              <textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="w-full min-h-[400px] p-5 bg-slate-950 border border-cyan-900/50 rounded-xl text-sm text-cyan-50 font-mono leading-relaxed focus:outline-none focus:border-cyan-400 focus:shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] resize-y custom-scrollbar"
                style={{
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                  textShadow: '0 0 1px rgba(6,182,212,0.5)'
                }}
              />

              {repurposeOpen && (
                <div className="mt-4 p-4 bg-slate-900/80 border border-cyan-500/30 rounded-xl glow-border">
                  <p className="text-[10px] font-bold text-cyan-400 font-mono uppercase tracking-widest mb-2">
                    INITIATE TRANSFORMATION PROTOCOL
                  </p>
                  <p className="text-xs text-cyan-500/80 font-mono mb-4">
                    Select target format for AI synthesis restructuring.
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={repurposeTarget}
                      onChange={(e) => setRepurposeTarget(e.target.value)}
                      className="flex-1 px-3 py-2 border border-cyan-900/50 rounded text-sm bg-slate-950 text-cyan-100 font-mono"
                    >
                      {templates.filter((t) => t.id !== templateType).map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-900">{t.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleRepurpose} 
                      disabled={repurposing}
                      className="px-4 py-2 bg-cyan-900/40 border border-cyan-500/50 text-cyan-300 font-mono text-xs uppercase rounded flex items-center gap-2 hover:bg-cyan-800/60 disabled:opacity-50 transition-colors"
                    >
                      {repurposing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      EXECUTE
                    </button>
                    <button
                      onClick={() => setRepurposeOpen(false)}
                      className="px-3 py-2 rounded text-xs font-mono uppercase text-slate-500 hover:text-red-400 transition-colors"
                    >
                      ABORT
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card title="OUTPUT BUFFER">
              <div className="text-center py-20 text-cyan-500/30">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm font-mono uppercase tracking-widest glow-text text-cyan-400">BUFFER EMPTY</p>
                <p className="text-xs font-mono mt-2 opacity-50">Provide input parameters to initiate synthesis.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}
