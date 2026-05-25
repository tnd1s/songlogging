'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState('point')
  const [pending, setPending] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    checkAdmin()
    fetchAll()
  }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!data?.is_admin) { router.push('/feed'); return }
  }

  async function fetchAll() {
    fetchPending()
    fetchPosts()
    fetchOrders()
  }

  async function fetchPending() {
    const { data } = await supabase.from('point_requests').select('*, users(login_code)').eq('status', 'pending').order('created_at', { ascending: false })
    if (data) setPending(data)
  }

  async function fetchPosts() {
    const { data } = await supabase.from('posts').select('*, users(login_code)').order('created_at', { ascending: false })
    if (data) setPosts(data)
  }

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*, users(login_code), products(name)').order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  async function approve(r: any) {
    await supabase.from('point_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', r.id)
    await supabase.rpc('increment_points', { user_id: r.user_id, amount: r.points })
    alert('포인트가 지급되었습니다 ✅')
    fetchPending()
  }

  async function reject(id: string) {
    await supabase.from('point_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id)
    alert('반려 처리되었습니다')
    fetchPending()
  }

  async function toggleNotice(post: any) {
    await supabase.from('posts').update({ is_notice: !post.is_notice }).eq('id', post.id)
    fetchPosts()
  }

  async function deletePost(id: string) {
    if (!confirm('게시물을 삭제할까요?')) return
    await supabase.from('posts').delete().eq('id', id)
    fetchPosts()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const missionLabel = (t:string) => t==='walk'?'🚶 걷기':t==='trash'?'🗑️ 쓰레기 줍기':'♻️ 분리수거'
  const btn:React.CSSProperties = {fontSize:'12px',fontWeight:700,padding:'6px 12px',cursor:'pointer',border:'2px solid #111',background:'#111',color:'#fff'}
  const btnOut:React.CSSProperties = {fontSize:'12px',fontWeight:700,padding:'6px 12px',cursor:'pointer',border:'2px solid #111',background:'#fff',color:'#111'}

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',maxWidth:'430px',margin:'0 auto',fontFamily:'inherit'}}>
      <div style={{background:'#111',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}}>
        <div style={{fontSize:'22px',fontWeight:900,color:'#5DD85A'}}>관리자 🌿</div>
        <button onClick={handleLogout} style={{background:'none',border:'none',color:'#888',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>로그아웃</button>
      </div>

      <div style={{background:'#111',display:'flex',borderTop:'1px solid #333'}}>
        {[['point','포인트 승인'],['post','게시물'],['order','구매내역']].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:'12px',background:'none',border:'none',cursor:'pointer',color:tab===key?'#5DD85A':'#666',fontSize:'13px',fontWeight:700,borderBottom:`3px solid ${tab===key?'#5DD85A':'transparent'}`}}>{label}</button>
        ))}
      </div>

      <div style={{padding:'12px 0'}}>
        {tab==='point' && (
          <>
            {pending.length===0 && <div style={{padding:'24px',textAlign:'center',color:'#555',fontSize:'14px',fontWeight:700}}>대기 중인 항목이 없습니다</div>}
            {pending.map(r=>(
              <div key={r.id} style={{background:'#fff',margin:'0 16px 8px',padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',fontWeight:700,color:'#111'}}>{r.users?.login_code}</div>
                  <div style={{fontSize:'12px',fontWeight:700,color:'#888',marginTop:'2px'}}>{missionLabel(r.mission_type)} · +{r.points.toLocaleString()}P</div>
                </div>
                <div style={{display:'flex',gap:'6px'}}>
                  <button onClick={()=>approve(r)} style={btn}>승인</button>
                  <button onClick={()=>reject(r.id)} style={{...btnOut,border:'2px solid #E24B4A',color:'#E24B4A'}}>반려</button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab==='post' && (
          <>
            {posts.length===0 && <div style={{padding:'24px',textAlign:'center',color:'#555',fontSize:'14px',fontWeight:700}}>게시물이 없습니다</div>}
            {posts.map(p=>(
              <div key={p.id} style={{background:'#fff',margin:'0 16px 8px',padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',fontWeight:700,color:'#111'}}>{p.users?.login_code} · {missionLabel(p.mission_type)}</div>
                  <div style={{fontSize:'12px',fontWeight:700,color:'#888',marginTop:'2px'}}>{p.description?.slice(0,30)}...</div>
                </div>
                <div style={{display:'flex',gap:'6px',flexDirection:'column'}}>
                  <button onClick={()=>toggleNotice(p)} style={btn}>{p.is_notice?'공지해제':'공지'}</button>
                  <button onClick={()=>deletePost(p.id)} style={{...btnOut,border:'2px solid #E24B4A',color:'#E24B4A'}}>삭제</button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab==='order' && (
          <>
            {orders.length===0 && <div style={{padding:'24px',textAlign:'center',color:'#555',fontSize:'14px',fontWeight:700}}>구매 내역이 없습니다</div>}
            {orders.map(o=>(
              <div key={o.id} style={{background:'#fff',margin:'0 16px 8px',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:'13px',fontWeight:700,color:'#111'}}>{o.users?.login_code} · {o.products?.name} {o.quantity}개</div>
                  <div style={{fontSize:'12px',fontWeight:700,color:'#888',marginTop:'2px'}}>{o.total_points.toLocaleString()}P · {new Date(o.created_at).toLocaleDateString('ko-KR')}</div>
                </div>
                <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',background:'#d4edda',color:'#155724'}}>완료</span>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  )
}
