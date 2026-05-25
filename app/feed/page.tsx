'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function FeedPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [myPoints, setMyPoints] = useState(0)
  const [comments, setComments] = useState<{[key:string]:string}>({})

  useEffect(() => {
    checkAuth()
    fetchPosts()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('points').eq('id', user.id).single()
    if (data) setMyPoints(data.points)
  }

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, users(login_code), likes(user_id), comments(id, content, users(login_code))')
      .order('created_at', { ascending: false })
    if (data) setPosts(data)
  }

  async function toggleLike(postId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const post = posts.find(p => p.id === postId)
    const liked = post.likes.some((l:any) => l.user_id === user.id)
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
    }
    fetchPosts()
  }

  async function addComment(postId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const content = comments[postId]?.trim()
    if (!content) return
    await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content })
    setComments(prev => ({ ...prev, [postId]: '' }))
    fetchPosts()
  }

  const btn:React.CSSProperties = {background:'#111',color:'#fff',border:'none',borderRadius:'0',padding:'8px 16px',fontSize:'13px',fontWeight:700,cursor:'pointer'}

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',maxWidth:'430px',margin:'0 auto',paddingBottom:'64px',fontFamily:'inherit'}}>
      <div style={{padding:'18px 20px 10px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#5DD85A',zIndex:10}}>
        <div style={{fontSize:'22px',fontWeight:900,color:'#111'}}>송로깅 🌿</div>
        <div style={{background:'#111',color:'#5DD85A',padding:'6px 14px',fontSize:'13px',fontWeight:700}}>{myPoints.toLocaleString()} P</div>
      </div>

      <div style={{background:'#111',margin:'0 16px 12px',padding:'12px 16px',display:'flex',alignItems:'center',gap:'10px'}}>
        <span style={{fontSize:'16px'}}>📢</span>
        <span style={{fontSize:'13px',fontWeight:700,color:'#5DD85A'}}>환경의 날 이벤트! 이번 주 포인트 2배 🎉</span>
      </div>

      {posts.map(post => (
        <div key={post.id} style={{background:'#fff',margin:'0 16px 14px'}}>
          <div style={{padding:'14px 16px 10px',display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'#111',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#5DD85A',flexShrink:0}}>{post.users?.login_code?.slice(0,2).toUpperCase()}</div>
            <div>
              <div style={{fontSize:'14px',fontWeight:700,color:'#111'}}>{post.users?.login_code}</div>
              <div style={{fontSize:'11px',color:'#888'}}>{post.mission_type} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</div>
            </div>
            {post.is_notice && <span style={{marginLeft:'auto',background:'#111',color:'#5DD85A',fontSize:'11px',fontWeight:700,padding:'3px 10px'}}>공지</span>}
          </div>
          {post.image_url && <img src={post.image_url} style={{width:'100%',height:'240px',objectFit:'cover'}} />}
          <div style={{padding:'12px 16px',fontSize:'14px',fontWeight:700,color:'#111',lineHeight:1.5}}>{post.description}</div>
          <div style={{padding:'10px 16px',display:'flex',gap:'16px',borderTop:'2px solid #111'}}>
            <button onClick={()=>toggleLike(post.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:700,color:'#111'}}>❤️ {post.likes?.length || 0}</button>
            <span style={{fontSize:'13px',fontWeight:700,color:'#111'}}>💬 {post.comments?.length || 0}</span>
          </div>
          <div style={{padding:'4px 16px 12px'}}>
            {post.comments?.slice(-2).map((c:any) => (
              <div key={c.id} style={{fontSize:'12px',fontWeight:700,color:'#111',marginBottom:'3px'}}>· {c.content}</div>
            ))}
            <div style={{display:'flex',gap:'6px',marginTop:'6px'}}>
              <input value={comments[post.id]||''} onChange={e=>setComments(prev=>({...prev,[post.id]:e.target.value}))} placeholder="댓글 달기..." style={{flex:1,border:'none',borderBottom:'2px solid #111',background:'transparent',padding:'6px 4px',fontSize:'13px',fontWeight:700,outline:'none',color:'#111'}} />
              <button onClick={()=>addComment(post.id)} style={btn}>등록</button>
            </div>
          </div>
        </div>
      ))}

      <div style={{background:'#111',display:'flex',position:'fixed',bottom:0,width:'100%',maxWidth:'430px'}}>
        {[['🏠','피드','/feed'],['🎯','미션','/mission'],['🏆','랭킹','/ranking'],['🛍️','상점','/shop'],['👤','마이','/my']].map(([icon,label,path])=>(
          <button key={path} onClick={()=>router.push(path as string)} style={{flex:1,padding:'12px 4px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',background:'none',border:'none',cursor:'pointer',color:path==='/feed'?'#5DD85A':'#666',fontSize:'10px',fontWeight:700}}>
            <span style={{fontSize:'20px'}}>{icon}</span>{label}
          </button>
        ))}
      </div>
    </main>
  )
}
