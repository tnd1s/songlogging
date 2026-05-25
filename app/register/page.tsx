'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  async function handleRegister() {
    if (!code) { alert('로그인 코드를 입력해주세요'); return }
    if (!password) { alert('비밀번호를 입력해주세요'); return }
    if (password !== password2) { alert('비밀번호가 일치하지 않습니다'); return }
    const email = `${code}@songlogging.school`
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { alert('가입 실패: ' + error.message); return }
    await supabase.from('users').insert({
      id: data.user!.id,
      grade: 0,
      class: 0,
      number: 0,
      login_code: code,
    })
    alert('가입 완료! 로그인해주세요 🎉')
    router.push('/login')
  }

  const inputStyle:React.CSSProperties = {width:'100%',padding:'14px',border:'none',borderBottom:'2.5px solid #111',background:'transparent',fontSize:'16px',fontWeight:700,outline:'none',color:'#111'}

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',maxWidth:'430px',margin:'0 auto',display:'flex',flexDirection:'column',padding:'40px 24px',gap:'20px',fontFamily:'inherit'}}>
      <button onClick={()=>router.push('/login')} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',textAlign:'left',fontWeight:900,color:'#111'}}>←</button>
      <div style={{fontSize:'28px',fontWeight:900,color:'#111'}}>회원가입</div>
      <div>
        <div style={{fontSize:'13px',fontWeight:700,color:'#111',marginBottom:'6px'}}>로그인 코드</div>
        <input value={code} onChange={e=>setCode(e.target.value)} placeholder="로그인 코드 입력" style={inputStyle} />
      </div>
      <div>
        <div style={{fontSize:'13px',fontWeight:700,color:'#111',marginBottom:'6px'}}>비밀번호</div>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="비밀번호 설정" style={inputStyle} />
      </div>
      <div>
        <div style={{fontSize:'13px',fontWeight:700,color:'#111',marginBottom:'6px'}}>비밀번호 확인</div>
        <input value={password2} onChange={e=>setPassword2(e.target.value)} type="password" placeholder="비밀번호 재입력" style={inputStyle} />
      </div>
      <button onClick={handleRegister} style={{width:'100%',background:'#111',color:'#fff',border:'none',borderRadius:'0',padding:'16px',fontSize:'16px',fontWeight:700,cursor:'pointer',marginTop:'8px'}}>가입하기</button>
    </main>
  )
}
