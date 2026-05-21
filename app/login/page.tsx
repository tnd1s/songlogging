'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [grade, setGrade] = useState('1')
  const [classNum, setClassNum] = useState('1')
  const [number, setNumber] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin() {
    const email = `${grade}-${classNum}-${number}@songlogging.school`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { alert('로그인 실패: 학년/반/번호 또는 비밀번호를 확인해주세요'); return }
    router.push('/feed')
  }

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 32px',gap:'32px'}}>
      <div style={{fontSize:'52px'}}>🌿</div>
      <div style={{fontSize:'32px',fontWeight:900,textAlign:'center',lineHeight:1.2}}>안녕하세요!<br/>송로깅입니다 :)</div>
      <div style={{fontSize:'15px',opacity:0.6}}>학년/반/번호로 로그인해 주세요.</div>
      <div style={{display:'flex',gap:'8px',width:'100%',maxWidth:'400px'}}>
        <select value={grade} onChange={e=>setGrade(e.target.value)} style={{flex:1,padding:'10px',borderRadius:'8px',border:'none',fontSize:'16px',fontWeight:700}}>
          <option value="1">1학년</option><option value="2">2학년</option><option value="3">3학년</option>
        </select>
        <select value={classNum} onChange={e=>setClassNum(e.target.value)} style={{flex:1,padding:'10px',borderRadius:'8px',border:'none',fontSize:'16px',fontWeight:700}}>
          {[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n}반</option>)}
        </select>
        <input value={number} onChange={e=>setNumber(e.target.value)} type="number" placeholder="번호" style={{flex:1,padding:'10px',borderRadius:'8px',border:'none',fontSize:'16px',fontWeight:700}} />
      </div>
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="비밀번호" style={{width:'100%',maxWidth:'400px',padding:'12px',borderRadius:'8px',border:'none',fontSize:'16px'}} />
      <div style={{display:'flex',gap:'12px',width:'100%',maxWidth:'400px'}}>
        <button onClick={handleLogin} style={{flex:1,background:'#111',color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontSize:'16px',fontWeight:700,cursor:'pointer'}}>로그인</button>
        <button onClick={()=>router.push('/register')} style={{flex:1,background:'transparent',color:'#111',border:'2.5px solid #111',borderRadius:'12px',padding:'14px',fontSize:'16px',fontWeight:700,cursor:'pointer'}}>회원가입</button>
      </div>
    </main>
  )
}
