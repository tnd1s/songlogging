'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function MissionPage() {
  const router = useRouter()
  const [myPoints, setMyPoints] = useState(0)
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [modal, setModal] = useState<string|null>(null)
  const [desc, setDesc] = useState('')
  const [steps, setSteps] = useState(0)
  const [file, setFile] = useState<File|null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchMyRequests()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('points').eq('id', user.id).single()
    if (data) setMyPoints(data.points)
  }

  async function fetchMyRequests() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('point_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setMyRequests(data)
  }

  async function handleUpload() {
    if (!desc.trim()) { alert('한마디를 입력해주세요'); return }
    if (modal === 'walk' && steps < 3000) { alert('3,000보 이상 걸어야 합니다'); return }
    if (!file) { alert('사진을 선택해주세요'); return }
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileName = `${user.id}/${Date.now()}.jpg`
    await supabase.storage.from('mission-photos').upload(fileName, file)
    const imageUrl = supabase.storage.from('mission-photos').getPublicUrl(fileName).data.publicUrl

    const { data: post } = await supabase.from('posts').insert({
      user_id: user.id,
      mission_type: modal,
      image_url: imageUrl,
      description: desc,
      step_count: modal === 'walk' ? steps : null,
    }).select().single()

    const ptMap: any = { walk: 3000, trash: 2000, recycle: 1000 }
    await supabase.from('point_requests').insert({
      user_id: user.id,
      post_id: post.id,
      mission_type: modal,
      points: ptMap[modal!],
    })

    setUploading(false)
    setModal(null)
    setDesc('')
    setSteps(0)
    setFile(null)
    alert('인증 완료! 관리자 검토 후 포인트 지급 🌿')
    fetchMyRequests()
  }

  const statusLabel = (s:string) => s==='pending'?'검토 중':s==='approved'?'승인 완료':'반려'
  const statusColor = (s:string) => s==='pending'?'#856404':s==='approved'?'#155724':'#721c24'
  const statusBg = (s:string) => s==='pending'?'#fff3cd':s==='approved'?'#d4edda':'#f8d7da'

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',maxWidth:'430px',margin:'0 auto',paddingBottom:'60px'}}>
      <div style={{padding:'18px 20px 10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:'22px',fontWeight:900}}>미션 🌿</div>
        <div style={{background:'#111',color:'#5DD85A',borderRadius:'20px',padding:'6px 14px',fontSize:'13px',fontWeight:700}}>{myPoints.toLocaleString()} P</div>
      </div>

      <div style={{margin:'0 16px 16px',background:'#111',borderRadius:'16px',padding:'20px'}}>
        <div style={{fontSize:'13px',color:'#888',marginBottom:'4px'}}>내 포인트</div>
        <div style={{fontSize:'36px',fontWeight:900,color:'#5DD85A'}}>{myPoints.toLocaleString()} P</div>
      </div>

      <div style={{padding:'0 16px 8px',fontSize:'13px',fontWeight:700,opacity:0.5}}>참여 가능한 미션</div>

      {[
        {type:'walk',icon:'🚶',name:'걷기 챌린지',desc:'3,000보 이상 걷고 인증 사진 업로드',pt:'+3,000P'},
        {type:'trash',icon:'🗑️',name:'쓰레기 줍기',desc:'봉투 한가득 쓰레기를 줍고 인증',pt:'+2,000P'},
        {type:'recycle',icon:'♻️',name:'분리수거',desc:'재활용품 분리수거 인증 사진 업로드',pt:'+1,000P'},
      ].map(m=>(
        <div key={m.type} onClick={()=>setModal(m.type)} style={{background:'#fff',margin:'0 16px 10px',borderRadius:'14px',padding:'16px',display:'flex',alignItems:'center',gap:'14px',cursor:'pointer'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'12px',background:'#5DD85A',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px'}}>{m.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'15px',fontWeight:700}}>{m.name}</div>
            <div style={{fontSize:'12px',color:'#888'}}>{m.desc}</div>
          </div>
          <div style={{fontSize:'14px',fontWeight:900}}>{m.pt}</div>
        </div>
      ))}

      <div style={{padding:'8px 16px 8px',fontSize:'13px',fontWeight:700,opacity:0.5}}>나의 미션 현황</div>
      <div style={{background:'#fff',margin:'0 16px',borderRadius:'14px',padding:'14px 16px'}}>
        {myRequests.length === 0 && <div style={{fontSize:'13px',color:'#888',textAlign:'center',padding:'12px'}}>아직 참여한 미션이 없어요</div>}
        {myRequests.map(r=>(
          <div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f0f0f0'}}>
            <span style={{fontSize:'13px',fontWeight:700}}>{r.mission_type === 'walk' ? '🚶 걷기' : r.mission_type === 'trash' ? '🗑️ 쓰레기 줍기' : '♻️ 분리수거'}</span>
            <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'20px',background:statusBg(r.status),color:statusColor(r.status)}}>{statusLabel(r.status)}{r.status==='approved'?` +${r.points.toLocaleString()}P`:''}</span>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:50}}>
          <div style={{background:'#fff',borderRadius:'16px 16px 0 0',width:'100%',maxWidth:'430px',padding:'20px',maxHeight:'85vh',overflowY:'auto'}}>
            <div style={{width:'40px',height:'4px',background:'#ddd',borderRadius:'2px',margin:'0 auto 16px'}}></div>
            <div style={{fontSize:'20px',fontWeight:900,marginBottom:'16px'}}>
              {modal==='walk'?'🚶 걷기 챌린지 인증':modal==='trash'?'🗑️ 쓰레기 줍기 인증':'♻️ 분리수거 인증'}
            </div>
            {modal==='walk' && (
              <div style={{marginBottom:'14px'}}>
                <div style={{fontSize:'13px',color:'#888',marginBottom:'4px'}}>오늘의 걸음 수</div>
                <div style={{fontSize:'32px',fontWeight:900}}>{steps.toLocaleString()}보</div>
                <div style={{height:'8px',background:'#eee',borderRadius:'4px',margin:'8px 0 4px',overflow:'hidden'}}>
                  <div style={{height:'8px',background:'#5DD85A',borderRadius:'4px',width:`${Math.min(100,Math.round(steps/3000*100))}%`}}></div>
                </div>
                <div style={{fontSize:'12px',color:'#888'}}>목표: 3,000보 이상</div>
                <input type="range" min="0" max="10000" value={steps} onChange={e=>setSteps(parseInt(e.target.value))} style={{width:'100%',marginTop:'8px'}} />
              </div>
            )}
            <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[e.target.files.length-1]||null)} style={{width:'100%',marginBottom:'12px'}} />
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'13px',fontWeight:700,opacity:0.6,marginBottom:'4px'}}>한마디</div>
              <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="미션 인증 내용을 간단히 적어주세요" style={{width:'100%',border:'none',borderBottom:'2px solid #111',background:'transparent',padding:'8px 4px',fontSize:'14px',outline:'none'}} />
            </div>
            <button onClick={handleUpload} disabled={uploading} style={{width:'100%',background:'#111',color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontSize:'16px',fontWeight:700,cursor:'pointer',marginBottom:'8px'}}>
              {uploading ? '업로드 중...' : '업로드 및 포인트 신청'}
            </button>
            <button onClick={()=>setModal(null)} style={{width:'100%',background:'transparent',border:'2.5px solid #111',borderRadius:'12px',padding:'14px',fontSize:'16px',fontWeight:700,cursor:'pointer'}}>취소</button>
          </div>
        </div>
      )}

      <div style={{background:'#111',display:'flex',position:'fixed',bottom:0,width:'100%',maxWidth:'430px'}}>
        {[['🏠','피드','/feed'],['🎯','미션','/mission'],['🏆','랭킹','/ranking'],['🛍️','상점','/shop'],['👤','마이','/my']].map(([icon,label,path])=>(
          <button key={path} onClick={()=>router.push(path as string)} style={{flex:1,padding:'12px 4px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',background:'none',border:'none',cursor:'pointer',color:path==='/mission'?'#5DD85A':'#666',fontSize:'10px'}}>
            <span style={{fontSize:'20px'}}>{icon}</span>{label}
          </button>
        ))}
      </div>
    </main>
  )
}
