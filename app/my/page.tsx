'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [myPoints, setMyPoints] = useState(0)
  const [orders, setOrders] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (data) { setUser(data); setMyPoints(data.points) }
    fetchOrders(user.id)
    fetchRequests(user.id)
  }

  async function fetchOrders(userId: string) {
    const { data } = await supabase
      .from('orders')
      .select('*, products(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  async function fetchRequests(userId: string) {
    const { data } = await supabase
      .from('point_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setRequests(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const missionLabel = (t:string) => t==='walk'?'🚶 걷기':t==='trash'?'🗑️ 쓰레기 줍기':'♻️ 분리수거'
  const statusLabel = (s:string) => s==='pending'?'검토 중':s==='approved'?'승인 완료':'반려'
  const statusBg = (s:string) => s==='pending'?'#fff3cd':s==='approved'?'#d4edda':'#f8d7da'
  const statusColor = (s:string) => s==='pending'?'#856404':s==='approved'?'#155724':'#721c24'

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',maxWidth:'430px',margin:'0 auto',paddingBottom:'60px'}}>
      <div style={{padding:'18px 20px 10px'}}>
        <div style={{fontSize:'22px',fontWeight:900}}>마이 🌿</div>
      </div>

      <div style={{background:'#111',margin:'0 16px 14px',borderRadius:'16px',padding:'24px 20px',textAlign:'center'}}>
        <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'#5DD85A',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',margin:'0 auto 12px'}}>😊</div>
        <div style={{fontSize:'18px',fontWeight:900,color:'#fff'}}>{user ? `${user.grade}학년 ${user.class}반 ${user.number}번` : ''}</div>
        <div style={{fontSize:'13px',color:'#888',marginTop:'4px'}}>보유 포인트</div>
        <div style={{fontSize:'32px',fontWeight:900,color:'#5DD85A'}}>{myPoints.toLocaleString()} P</div>
      </div>

      <div style={{background:'#fff',margin:'0 16px 14px',borderRadius:'14px',padding:'14px 16px'}}>
        <div style={{fontSize:'14px',fontWeight:700,marginBottom:'10px'}}>미션 현황</div>
        {requests.length === 0 && <div style={{fontSize:'13px',color:'#888',textAlign:'center',padding:'8px'}}>아직 참여한 미션이 없어요</div>}
        {requests.map(r=>(
          <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #f0f0f0'}}>
            <span style={{fontSize:'13px',fontWeight:700}}>{missionLabel(r.mission_type)}</span>
            <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'20px',background:statusBg(r.status),color:statusColor(r.status)}}>{statusLabel(r.status)}{r.status==='approved'?` +${r.points.toLocaleString()}P`:''}</span>
          </div>
        ))}
      </div>

      <div style={{background:'#fff',margin:'0 16px 14px',borderRadius:'14px',padding:'14px 16px'}}>
        <div style={{fontSize:'14px',fontWeight:700,marginBottom:'10px'}}>구매 내역</div>
        {orders.length === 0 && <div style={{fontSize:'13px',color:'#888',textAlign:'center',padding:'8px'}}>구매 내역이 없어요</div>}
        {orders.map(o=>(
          <div key={o.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f0f0f0',fontSize:'13px'}}>
            <span style={{fontWeight:700}}>{o.products?.name} {o.quantity}개</span>
            <span style={{color:'#E24B4A',fontWeight:700}}>-{o.total_points.toLocaleString()}P</span>
          </div>
        ))}
      </div>

      <button onClick={handleLogout} style={{background:'#fff',color:'#E24B4A',border:'2px solid #E24B4A',borderRadius:'12px',padding:'13px',fontSize:'14px',fontWeight:700,cursor:'pointer',width:'calc(100% - 32px)',margin:'0 16px'}}>로그아웃</button>

      <div style={{background:'#111',display:'flex',position:'fixed',bottom:0,width:'100%',maxWidth:'430px'}}>
        {[['🏠','피드','/feed'],['🎯','미션','/mission'],['🏆','랭킹','/ranking'],['🛍️','상점','/shop'],['👤','마이','/my']].map(([icon,label,path])=>(
          <button key={path} onClick={()=>router.push(path as string)} style={{flex:1,padding:'12px 4px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',background:'none',border:'none',cursor:'pointer',color:path==='/my'?'#5DD85A':'#666',fontSize:'10px'}}>
            <span style={{fontSize:'20px'}}>{icon}</span>{label}
          </button>
        ))}
      </div>
    </main>
  )
}
