export async function POST(request: Request) {
  const supabase = createRouteHandlerClient()
  const session = await supabase.auth.getSession()
  
  // Check company verification status
  const { data: company } = await supabase
    .from('companies')
    .select('verification_status')
    .eq('id', session.user.user_metadata.company_id)
    .single()

  if (company?.verification_status !== 'verified') {
    return new Response('Company requires verification', { status: 403 })
  }

  const formData = await request.json()
  
  // Add recruitment-specific validation
  if (formData.position_type === 'contract' && !formData.contract_duration) {
    return new Response('Contract duration required', { status: 400 })
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert([{
      ...formData,
      company_id: session.user.user_metadata.company_id,
      is_confidential: formData.client_company ? true : false
    }])
    .select()

  if (error) return new Response(error.message, { status: 500 })
  return Response.json(data[0])
} 