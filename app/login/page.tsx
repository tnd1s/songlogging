'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin() {
    if (!code || !password) { alert('로그인 코드와 비밀번호를 입력해주세요'); return }
    const email = `${code}@songlogging.school`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { alert('로그인 실패: 코드 또는 비밀번호를 확인해주세요'); return }
    router.push('/feed')
  }

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',maxWidth:'430px',margin:'0 auto',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',gap:'28px',fontFamily:'inherit'}}>
      <div style={{fontSize:'52px'}}>🌿</div>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'32px',fontWeight:900,color:'#111',lineHeight:1.2}}>안녕하세요!<br/>송로깅입니다 :)</div>
        <div style={{fontSize:'14px',color:'#111',opacity:0.5,marginTop:'8px'}}>로그인 코드로 로그인해 주세요.</div>
      </div>
      <div style={{width:'100%',display:'flex',flexDirection:'column',gap:'12px'}}>
        <div>
          <div style={{fontSize:'13px',fontWeight:700,color:'#111',marginBottom:'6px'}}>로그인 코드</div>
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="로그인 코드 입력" style={{width:'100%',padding:'14px',border:'none',borderBottom:'2.5px solid #111',background:'transparent',fontSize:'16px',fontWeight:700,outline:'none',color:'#111'}} />
        </div>
        <div>
          <div style={{fontSize:'13px',fontWeight:700,color:'#111',marginBottom:'6px'}}>비밀번호</div>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="비밀번호 입력" style={{width:'100%',padding:'14px',border:'none',borderBottom:'2.5px solid #111',background:'transparent',fontSize:'16px',fontWeight:700,outline:'none',color:'#111'}} />
        </div>
        <button onClick={handleLogin} style={{width:'100%',background:'#111',color:'#fff',border:'none',borderRadius:'0',padding:'16px',fontSize:'16px',fontWeight:700,cursor:'pointer',marginTop:'8px'}}>로그인</button>
        <button onClick={()=>router.push('/register')} style={{width:'100%',background:'#111',color:'#fff',border:'none',borderRadius:'0',padding:'16px',fontSize:'16px',fontWeight:700,cursor:'pointer'}}>회원가입</button>
      </div>
    </main>
  )
}
