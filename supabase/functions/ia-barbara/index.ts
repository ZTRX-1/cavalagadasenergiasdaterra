import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const expectedKey = Deno.env.get('IA_BARBARA_API_KEY')

    if (!expectedKey) {
      return new Response(JSON.stringify({ error: 'Configuração incompleta' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
    if (!token || token !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const url = new URL(req.url)
    const method = req.method

    if (method === 'GET') {
      const action = url.searchParams.get('action')

      if (action === 'expedicoes') {
        const { data: expedicoes, error } = await supabaseAdmin
          .from('expedicoes')
          .select('id, slug, nome, subtitulo, duracao, nivel, preco, moeda, marca, estado, cidade')
          .eq('ativo', true)
          .eq('status', 'publicado')
          .order('ordem')
        if (error) throw error
        const ids = expedicoes.map(e => e.id)
        const { data: datas } = await supabaseAdmin
          .from('datas')
          .select('id, expedicao_id, data_inicio, data_fim, vagas_disponiveis, status')
          .in('expedicao_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
          .order('data_inicio')
        return new Response(JSON.stringify({ expedicoes, datas }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const id = url.searchParams.get('id')
      const telefone = url.searchParams.get('telefone')
      const email = url.searchParams.get('email')

      let query = supabaseAdmin.from('leads').select('*')
      if (id) query = query.eq('id', id)
      else if (telefone) query = query.eq('telefone', telefone)
      else if (email) query = query.eq('email', email)

      const { data: lead, error } = await query.maybeSingle()
      if (error) throw error
      if (!lead) return new Response(JSON.stringify({ lead: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      const [{ data: memoria }, { data: conversas }] = await Promise.all([
        supabaseAdmin.from('lead_memoria').select('*').eq('lead_id', lead.id).maybeSingle(),
        supabaseAdmin.from('lead_conversas').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }).limit(100)
      ])

      return new Response(JSON.stringify({ lead, memoria, conversas }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (method === 'POST') {
      const body = await req.json()
      const { action } = body

      if (action === 'upsert_lead') {
        const { telefone, email, nome, ...rest } = body
        let existingId: string | null = null
        if (telefone) {
          const { data } = await supabaseAdmin.from('leads').select('id').eq('telefone', telefone).maybeSingle()
          existingId = data?.id
        }
        if (!existingId && email) {
          const { data } = await supabaseAdmin.from('leads').select('id').eq('email', email).maybeSingle()
          existingId = data?.id
        }
        if (existingId) {
          const { data, error } = await supabaseAdmin.from('leads').update({ ...rest, ultima_interacao_at: new Date().toISOString() }).eq('id', existingId).select().single()
          if (error) throw error
          return new Response(JSON.stringify({ lead: data, created: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } else {
          const { data: protocolo } = await supabaseAdmin.rpc('gerar_protocolo_lead')
          const { data, error } = await supabaseAdmin.from('leads').insert({ nome, email, telefone, protocolo, status_atendimento: 'ia', ...rest }).select().single()
          if (error) throw error
          return new Response(JSON.stringify({ lead: data, created: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      if (action === 'update_campos') {
        const { lead_id, ...patch } = body
        patch.ultima_interacao_at = new Date().toISOString()
        if (patch.etapa_atendimento) patch.status = patch.etapa_atendimento
        const { data, error } = await supabaseAdmin.from('leads').update(patch).eq('id', lead_id).select().single()
        if (error) throw error
        return new Response(JSON.stringify({ lead: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'registrar_conversa' || action === 'registrar_timeline') {
        const { lead_id, conteudo, tipo, evento, descricao, canal, direcao, autor_nome, metadata } = body
        const { data, error } = await supabaseAdmin.from('lead_conversas').insert({
          lead_id,
          conteudo: conteudo || descricao,
          tipo_evento: tipo || evento || 'mensagem_ia',
          canal: canal || 'whatsapp',
          direcao: direcao || 'entrada',
          autor_nome: autor_nome || 'ia_barbara',
          metadata: metadata || {}
        }).select().single()
        if (error) throw error
        await supabaseAdmin.from('leads').update({ ultima_interacao_at: new Date().toISOString() }).eq('id', lead_id)
        return new Response(JSON.stringify({ result: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'transferir_humano') {
        const { lead_id, motivo } = body
        const { data, error } = await supabaseAdmin.from('leads').update({
          status_atendimento: 'humano',
          proxima_acao: motivo || 'Transferido para atendimento humano'
        }).eq('id', lead_id).select().single()
        if (error) throw error
        return new Response(JSON.stringify({ lead: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    return new Response(JSON.stringify({ error: 'Ação não suportada' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
