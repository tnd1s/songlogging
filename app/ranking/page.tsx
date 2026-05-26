'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RankingPage() {
  const router = useRouter()
  const [ranks, setRanks] = useState<any[]>([])
  const [myRank, setMyRank] = useState<number>(0)
  const [mySteps, setMySteps] = useState<number>(0)

  useEffect(() => {
    checkAuth()
    fetchRanks()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
  }

  async function fetchRanks() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const monday = getMonday()
    const { data } = await supabase
      .from('step_logs')
      .select('steps, user_id, users(login_code)')
      .eq('week_start', monday)
      .order('steps', { ascending: false })
    if (data) {
      setRanks(data)
      const myIdx = data.findIndex(r => r.user_id === user.id)
      if (myIdx >= 0) { setMyRank(myIdx + 1); setMySteps(data[myIdx].steps) }
    }
  }

  function getMonday() {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

  const medal = (i:number) => i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`
  const max = ranks[0]?.steps || 1

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',maxWidth:'430px',margin:'0 auto',paddingBottom:'64px',fontFamily:'inherit'}}>
      <div style={{padding:'18px 20px 10px',position:'sticky',top:0,background:'#5DD85A',zIndex:10}}>
        <div style={{fontSize:'22px',fontWeight:900,color:'#111'}}>랭킹 </div>
      </div>

      <div style={{margin:'0 16px 16px',background:'#111',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:'13px',fontWeight:700,color:'#888'}}>이번 주 내 순위</div>
          <div style={{fontSize:'28px',fontWeight:900,color:'#5DD85A'}}>{myRank > 0 ? `${myRank}위 · ${mySteps.toLocaleString()}보` : '기록 없음'}</div>
        </div>
        <span style={{fontSize:'40px'}}>🏆</span>
      </div>

      <div style={{background:'#fff',margin:'0 16px',padding:'8px 16px'}}>
        {ranks.length === 0 && <div style={{fontSize:'13px',fontWeight:700,color:'#888',textAlign:'center',padding:'20px'}}>이번 주 걸음수 기록이 없어요</div>}
        {ranks.map((r,i) => (
          <div key={r.user_id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 0',borderBottom: i < ranks.length-1 ? '1px solid #eee' : 'none'}}>
            <div style={{width:'30px',fontSize:'16px',fontWeight:900,textAlign:'center',color:i===0?'#f0a500':i===1?'#999':i===2?'#cd7f32':'#111'}}>{medal(i)}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:'14px',fontWeight:700,color:'#111'}}>{r.users?.login_code}</div>
              <div style={{height:'6px',background:'#eee',marginTop:'6px'}}>
                <div style={{height:'6px',background:'#111',width:`${Math.round(r.steps/max*100)}%`}}></div>
              </div>
            </div>
            <div style={{fontSize:'13px',fontWeight:700,color:'#111'}}>{r.steps.toLocaleString()}보</div>
          </div>
        ))}
      </div>

      <div style={{background:'#111',display:'flex',position:'fixed',bottom:0,width:'100%',maxWidth:'430px'}}>
        {[['🏠','피드','/feed'],['🎯','미션','/mission'],['🏆','랭킹','/ranking'],['🛍️','상점','/shop'],['👤','마이','/my']].map(([icon,label,path])=>(
          <button key={path} onClick={()=>router.push(path as string)} style={{flex:1,padding:'12px 4px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',background:'none',border:'none',cursor:'pointer',color:path==='/ranking'?'#5DD85A':'#666',fontSize:'10px',fontWeight:700}}>
            <span style={{fontSize:'20px'}}>{icon}</span>{label}
          </button>
        ))}
      </div>
    </main>
  )
}
