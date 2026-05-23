'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [grade, setGrade] = useState('1')
  const [classNum, setClassNum] = useState('1')
  const [number, setNumber] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  async function handleRegister() {
    if (!number) { alert('번호를 입력해주세요'); return }
    if (!password) { alert('비밀번호를 입력해주세요'); return }
    if (password !== password2) { alert('비밀번호가 일치하지 않습니다'); return }
    const email = `${grade}-${classNum}-${number}@songlogging.school`
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { alert('가입 실패: ' + error.message); return }
    await supabase.from('users').insert({
      id: data.user!.id,
      grade: parseInt(grade),
      class: parseInt(classNum),
      number: parseInt(number),
    })
    alert('가입 완료! 로그인해주세요 🎉')
    router.push('/login')
  }

  const sel:React.CSSProperties = {flex:1,padding:'10px',background:'transparent',fontSize:'16px',fontWeight:700,border:'none',borderBottom:'2.5px solid #111',outline:'none'}
  const inp:React.CSSProperties = {width:'100%',padding:'10px',background:'transparent',fontSize:'16px',border:'none',borderBottom:'2.5px solid #111',outline:'none'}

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',display:'flex',flexDirection:'column',padding:'40px 32px',gap:'20px',maxWidth:'400px',margin:'0 auto'}}>
      <button onClick={()=>router.push('/login')} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',textAlign:'left'}}>←</button>
      <div style={{fontSize:'28px',fontWeight:900}}>회원가입</div>
      <div>
        <div style={{fontSize:'13px',fontWeight:700,opacity:0.6,marginBottom:'6px'}}>학년 / 반 / 번호</div>
        <div style={{display:'flex',gap:'8px'}}>
          <select value={grade} onChange={e=>setGrade(e.target.value)} style={sel}>
            <option value="1">1학년</option><option value="2">2학년</option><option value="3">3학년</option>
          </select>
          <select value={classNum} onChange={e=>setClassNum(e.target.value)} style={sel}>
            {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}반</option>)}
          </select>
          <input value={number} onChange={e=>setNumber(e.target.value)} type="number" placeholder="번호" style={{...sel,flex:1}} />
        </div>
      </div>
      <div>
        <div style={{fontSize:'13px',fontWeight:700,opacity:0.6,marginBottom:'6px'}}>비밀번호</div>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="비밀번호 설정" style={inp} />
      </div>
      <div>
        <div style={{fontSize:'13px',fontWeight:700,opacity:0.6,marginBottom:'6px'}}>비밀번호 확인</div>
        <input value={password2} onChange={e=>setPassword2(e.target.value)} type="password" placeholder="비밀번호 재입력" style={inp} />
      </div>
      <button onClick={handleRegister} style={{background:'#111',color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontSize:'16px',fontWeight:700,cursor:'pointer',marginTop:'8px'}}>가입하기</button>
    </main>
  )
}
