import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar se o usuário atual é super admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verificar token e obter usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar se é super admin
    const { data: adminData, error: adminError } = await supabase
      .from('usuarios_admin')
      .select('tipo_admin')
      .eq('email', user.email)
      .eq('ativo', true)
      .single()

    if (adminError || adminData?.tipo_admin !== 'super_admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas super admins podem criar usuários.' }, { status: 403 })
    }

    // 2. Obter dados do corpo da requisição
    const body = await request.json()
    const { email, nome, tipo_admin, prefeitura_id, senha } = body

    if (!email || !nome || !tipo_admin) {
      return NextResponse.json({ error: 'Email, nome e tipo_admin são obrigatórios' }, { status: 400 })
    }

    if (tipo_admin === 'admin_prefeitura' && !prefeitura_id) {
      return NextResponse.json({ error: 'prefeitura_id é obrigatório para admin_prefeitura' }, { status: 400 })
    }

    // 3. Criar usuário no Supabase Auth usando service role
    const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: senha || '123456',
      email_confirm: true,
      user_metadata: {
        nome: nome,
        tipo_admin: tipo_admin
      }
    })

    if (createAuthError) {
      console.error('Erro ao criar usuário no auth:', createAuthError)
      return NextResponse.json({ 
        error: `Erro ao criar usuário: ${createAuthError.message}` 
      }, { status: 400 })
    }

    // 4. Criar registro na tabela usuarios_admin
    const { error: insertError } = await supabase
      .from('usuarios_admin')
      .insert([{
        email: email,
        nome: nome,
        tipo_admin: tipo_admin,
        prefeitura_id: tipo_admin === 'super_admin' ? null : prefeitura_id,
        ativo: true
      }])

    if (insertError) {
      // Se falhar ao inserir na tabela, deletar usuário do auth
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      
      console.error('Erro ao inserir na tabela usuarios_admin:', insertError)
      return NextResponse.json({ 
        error: `Erro ao criar registro admin: ${insertError.message}` 
      }, { status: 400 })
    }

    // 5. Sucesso
    return NextResponse.json({
      success: true,
      message: 'Administrador criado com sucesso!',
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        nome: nome,
        tipo_admin: tipo_admin
      }
    })

  } catch (error: any) {
    console.error('Erro interno ao criar admin:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}