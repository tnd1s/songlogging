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
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [writeModal, setWriteModal] = useState(false)
  const [writeDesc, setWriteDesc] = useState('')
  const [isNotice, setIsNotice] = useState(false)
  const [posting, setPosting] = useState(false)
  const [capModal, setCapModal] = useState<any|null>(null)
  const [capPoint, setCapPoint] = useState(500)

  useEffect(() => { checkAdmin() }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!data?.is_admin) { router.push('/feed'); return }
    setUserId(user.id)
    setLoading(false)
    fetchPending(); fetchPosts(); fetchOrders()
  }

  async function fetchPending() {
    const { data } = await supabase.from('point_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false })
    if (!data) return
    const withUsers = await Promise.all(data.map(async r => {
      const { data: u } = await supabase.from('users').select('login_code').eq('id', r.user_id).single()
      return { ...r, login_code: u?.login_code }
    }))
    setPending(withUsers)
  }

  async function fetchPosts() {
    const { data } = await supabase.from('posts').select('*, likes(user_id), comments(id,content)').order('created_at', { ascending: false })
    if (!data) return
    const withUsers = await Promise.all(data.map(async p => {
      const { data: u } = await supabase.from('users').select('login_code').eq('id', p.user_id).single()
      return { ...p, login_code: u?.login_code }
    }))
    setPosts(withUsers)
  }

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*, products(name)').order('created_at', { ascending: false })
    if (!data) return
    const withUsers = await Promise.all(data.map(async o => {
      const { data: u } = await supabase.from('users').select('login_code').eq('id', o.user_id).single()
      return { ...o, login_code: u?.login_code }
    }))
    setOrders(withUsers)
  }

  async function approve(r: any) {
    if (r.mission_type === 'cap') {
      setCapModal(r)
      return
    }
    await supabase.from('point_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', r.id)
    await supabase.rpc('increment_points', { user_id: r.user_id, amount: r.points })
    alert('포인트가 지급되었습니다 ✅')
    fetchPending()
  }

  async function approveCapPoint() {
    await supabase.from('point_requests').update({ status: 'approved', reviewed_at: new Date().toISOString(), points: capPoint }).eq('id', capModal.id)
    await supabase.rpc('increment_points', { user_id: capModal.user_id, amount: capPoint })
    setCapModal(null)
    alert(`${capPoint}P 지급되었습니다 ✅`)
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

  async function deleteComment(commentId: string) {
    if (!confirm('댓글을 삭제할까요?')) return
    await supabase.from('comments').delete().eq('id', commentId)
    fetchPosts()
  }

  async function handleWrite() {
    if (!writeDesc.trim()) { alert('내용을 입력해주세요'); return }
    setPosting(true)
    await supabase.from('posts').insert({
      user_id: userId,
      mission_type: '📢 관리자',
      description: writeDesc,
      is_notice: isNotice,
    })
    setPosting(false)
    setWriteModal(false)
    setWriteDesc('')
    setIsNotice(false)
    fetchPosts()
    alert('게시 완료!')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const missionLabel = (t:string) => t==='walk'?'🚶 걷기':t==='trash'?'🗑️ 쓰레기 줍기':t==='recycle'?'♻️ 분리수거':t==='invite'?'📱 친구초대':t==='cap'?'🪙 병뚜껑':'📢 관리자'
  const btn:React.CSSProperties = {fontSize:'12px',fontWeight:700,padding:'6px 12px',cursor:'pointer',border:'2px solid #111',background:'#111',color:'#fff'}
  const btnOut:React.CSSProperties = {fontSize:'12px',fontWeight:700,padding:'6px 12px',cursor:'pointer',border:'2px solid #E24B4A',background:'#fff',color:'#E24B4A'}

  if (loading) return <main style={{background:'#5DD85A',minHeight:'100vh',maxWidth:'430px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontSize:'18px',fontWeight:700,color:'#111'}}>로딩 중...</div></main>

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',maxWidth:'430px',margin:'0 auto',fontFamily:'inherit'}}>
      <div style={{background:'#111',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}}>
        <div style={{fontSize:'22px',fontWeight:900,color:'#5DD85A'}}><span style={{display:'flex',alignItems:'center',gap:'8px'}}><img src='/icon.png' style={{width:'28px',height:'28px',objectFit:'contain'}} /><span>관리자</span></span></div>
        <button onClick={handleLogout} style={{background:'none',border:'none',color:'#888',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>로그아웃</button>
      </div>

      <div style={{background:'#111',display:'flex',borderTop:'1px solid #333'}}>
        {[['point','포인트 승인'],['feed','피드'],['post','게시물'],['order','구매내역']].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:'12px 4px',background:'none',border:'none',cursor:'pointer',color:tab===key?'#5DD85A':'#666',fontSize:'12px',fontWeight:700,borderBottom:`3px solid ${tab===key?'#5DD85A':'transparent'}`}}>{label}</button>
        ))}
      </div>

      <div style={{padding:'12px 0'}}>

        {tab==='point' && (
          <>
            {pending.length===0 && <div style={{padding:'24px',textAlign:'center',color:'#555',fontSize:'14px',fontWeight:700}}>대기 중인 항목이 없습니다</div>}
            {pending.map(r=>(
              <div key={r.id} style={{background:'#fff',margin:'0 16px 8px',padding:'14px 16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:700,color:'#111'}}>{r.login_code}</div>
                    <div style={{fontSize:'12px',fontWeight:700,color:'#888',marginTop:'2px'}}>{missionLabel(r.mission_type)} · +{r.points.toLocaleString()}P</div>
                    {r.description && <div style={{fontSize:'11px',color:'#5DD85A',fontWeight:700,marginTop:'2px'}}>{r.description}</div>}
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button onClick={()=>approve(r)} style={btn}>승인</button>
                    <button onClick={()=>reject(r.id)} style={btnOut}>반려</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {tab==='feed' && (
          <>
            <div style={{padding:'0 16px 10px'}}>
              <button onClick={()=>setWriteModal(true)} style={{width:'100%',background:'#111',color:'#fff',border:'none',padding:'14px',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>✏️ 관리자 글 작성</button>
            </div>
            {posts.map(p=>(
              <div key={p.id} style={{background:'#fff',margin:'0 16px 12px'}}>
                <div style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:'8px'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'#111',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#5DD85A'}}>{p.login_code?.slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:700,color:'#111'}}>{p.login_code}</div>
                    <div style={{fontSize:'11px',color:'#888'}}>{missionLabel(p.mission_type)}</div>
                  </div>
                  {p.is_notice && <span style={{background:'#111',color:'#5DD85A',fontSize:'10px',fontWeight:700,padding:'2px 8px'}}>공지</span>}
                </div>
                {p.image_url && <img src={p.image_url} style={{width:'100%',height:'180px',objectFit:'cover'}} />}
                <div style={{padding:'10px 14px',fontSize:'13px',fontWeight:700,color:'#111'}}>{p.description}</div>
                <div style={{padding:'8px 14px',display:'flex',gap:'8px',borderTop:'1px solid #eee',flexWrap:'wrap'}}>
                  <button onClick={()=>toggleNotice(p)} style={{...btn,fontSize:'11px',padding:'4px 10px'}}>{p.is_notice?'공지해제':'공지지정'}</button>
                  <button onClick={()=>deletePost(p.id)} style={{...btnOut,fontSize:'11px',padding:'4px 10px'}}>삭제</button>
                </div>
                {p.comments?.length > 0 && (
                  <div style={{padding:'4px 14px 10px',borderTop:'1px solid #eee'}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:'#888',marginBottom:'4px'}}>댓글</div>
                    {p.comments.map((c:any)=>(
                      <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0'}}>
                        <div style={{fontSize:'12px',fontWeight:700,color:'#111'}}>· {c.content}</div>
                        <button onClick={()=>deleteComment(c.id)} style={{background:'none',border:'none',color:'#E24B4A',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>삭제</button>
                      </div>
                    ))}
                  </div>
                )}
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
                  <div style={{fontSize:'13px',fontWeight:700,color:'#111'}}>{p.login_code} · {missionLabel(p.mission_type)}</div>
                  <div style={{fontSize:'12px',fontWeight:700,color:'#888',marginTop:'2px'}}>{p.description?.slice(0,30)}...</div>
                </div>
                <div style={{display:'flex',gap:'6px',flexDirection:'column'}}>
                  <button onClick={()=>toggleNotice(p)} style={btn}>{p.is_notice?'공지해제':'공지'}</button>
                  <button onClick={()=>deletePost(p.id)} style={btnOut}>삭제</button>
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
                  <div style={{fontSize:'13px',fontWeight:700,color:'#111'}}>{o.login_code} · {o.products?.name} {o.quantity}개</div>
                  <div style={{fontSize:'12px',fontWeight:700,color:'#888',marginTop:'2px'}}>{o.total_points.toLocaleString()}P · {new Date(o.created_at).toLocaleDateString('ko-KR')}</div>
                </div>
                <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',background:'#d4edda',color:'#155724'}}>완료</span>
              </div>
            ))}
          </>
        )}
      </div>

      {writeModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:50}}>
          <div style={{background:'#fff',width:'100%',maxWidth:'430px',padding:'20px',maxHeight:'85vh',overflowY:'auto'}}>
            <div style={{width:'40px',height:'4px',background:'#ddd',margin:'0 auto 16px'}}></div>
            <div style={{fontSize:'20px',fontWeight:900,color:'#111',marginBottom:'16px'}}>관리자 글 작성</div>
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'13px',fontWeight:700,color:'#111',marginBottom:'4px'}}>내용</div>
              <textarea value={writeDesc} onChange={e=>setWriteDesc(e.target.value)} placeholder="내용을 입력해주세요" rows={4} style={{width:'100%',border:'2px solid #111',background:'transparent',padding:'10px',fontSize:'14px',fontWeight:700,outline:'none',color:'#111',resize:'none'}} />
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
              <input type="checkbox" id="notice-check" checked={isNotice} onChange={e=>setIsNotice(e.target.checked)} style={{width:'18px',height:'18px',cursor:'pointer'}} />
              <label htmlFor="notice-check" style={{fontSize:'14px',fontWeight:700,color:'#111',cursor:'pointer'}}>공지로 지정</label>
            </div>
            <button onClick={handleWrite} disabled={posting} style={{width:'100%',background:'#111',color:'#fff',border:'none',padding:'16px',fontSize:'16px',fontWeight:700,cursor:'pointer',marginBottom:'8px'}}>{posting?'게시 중...':'게시하기'}</button>
            <button onClick={()=>setWriteModal(false)} style={{width:'100%',background:'#fff',color:'#111',border:'2px solid #111',padding:'14px',fontSize:'16px',fontWeight:700,cursor:'pointer'}}>취소</button>
          </div>
        </div>
      )}

      {capModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'20px'}}>
          <div style={{background:'#fff',width:'100%',maxWidth:'390px',padding:'24px'}}>
            <div style={{fontSize:'18px',fontWeight:900,color:'#111',marginBottom:'8px'}}>🪙 병뚜껑 포인트 부여</div>
            <div style={{fontSize:'13px',fontWeight:700,color:'#888',marginBottom:'16px'}}>{capModal.login_code} · {capModal.description}</div>
            <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
              <button onClick={()=>setCapPoint(500)} style={{flex:1,padding:'12px',fontWeight:700,fontSize:'14px',border:'2px solid #111',background:capPoint===500?'#111':'#fff',color:capPoint===500?'#fff':'#111',cursor:'pointer'}}>500P</button>
              <button onClick={()=>setCapPoint(1000)} style={{flex:1,padding:'12px',fontWeight:700,fontSize:'14px',border:'2px solid #111',background:capPoint===1000?'#111':'#fff',color:capPoint===1000?'#fff':'#111',cursor:'pointer'}}>1,000P</button>
            </div>
            <button onClick={approveCapPoint} style={{width:'100%',background:'#111',color:'#fff',border:'none',padding:'14px',fontSize:'15px',fontWeight:700,cursor:'pointer',marginBottom:'8px'}}>포인트 지급</button>
            <button onClick={()=>setCapModal(null)} style={{width:'100%',background:'#fff',color:'#111',border:'2px solid #111',padding:'12px',fontSize:'15px',fontWeight:700,cursor:'pointer'}}>취소</button>
          </div>
        </div>
      )}

    </main>
  )
}
