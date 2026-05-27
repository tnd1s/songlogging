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
  const [capCount, setCapCount] = useState(15)
  const [capReward, setCapReward] = useState<'point'|'keyring'>('point')
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
    if (modal === 'cap' && capCount < 15) { alert('최소 15개 이상이어야 합니다'); return }
    if (!file) { alert('사진을 선택해주세요'); return }
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let imageUrl = ''
    const fileName = `${user.id}/${Date.now()}.jpg`
    await supabase.storage.from('mission-photos').upload(fileName, file)
    imageUrl = supabase.storage.from('mission-photos').getPublicUrl(fileName).data.publicUrl

    const ptMap: any = { walk: 3000, trash: 2000, recycle: 1000, invite: 500, cap: capCount >= 30 ? (capReward === 'keyring' ? 0 : 1000) : 500 }
    const toFeed = modal !== 'invite'

    if (toFeed) {
      await supabase.from('posts').insert({
        user_id: user.id,
        mission_type: modal,
        image_url: imageUrl,
        description: desc,
        step_count: modal === 'walk' ? steps : null,
      })
    }

    await supabase.from('point_requests').insert({
      user_id: user.id,
      mission_type: modal,
      points: ptMap[modal!],
      status: 'pending',
      ...(modal === 'cap' ? { description: `${capCount}개 / ${capCount >= 30 ? (capReward === 'keyring' ? '키링 교환' : '포인트 지급') : '포인트 지급'}` } : {}),
    })

    setUploading(false)
    setModal(null)
    setDesc('')
    setSteps(0)
    setFile(null)
    alert('인증 완료! 관리자 검토 후 포인트 지급 ')
    fetchMyRequests()
  }

  const statusLabel = (s:string) => s==='pending'?'검토 중':s==='approved'?'승인 완료':'반려'
  const statusColor = (s:string) => s==='pending'?'#856404':s==='approved'?'#155724':'#721c24'
  const statusBg = (s:string) => s==='pending'?'#fff3cd':s==='approved'?'#d4edda':'#f8d7da'
  const btn:React.CSSProperties = {width:'100%',background:'#111',color:'#fff',border:'none',borderRadius:'0',padding:'16px',fontSize:'16px',fontWeight:700,cursor:'pointer'}

  const missions = [
    {type:'walk',icon:'',name:'걷기 챌린지',desc:'3,000보 이상 걷고 인증 사진 업로드',pt:'+3,000P'},
    {type:'trash',icon:'',name:'쓰레기 줍기',desc:'봉투 한가득 쓰레기를 줍고 인증',pt:'+2,000P'},
    {type:'recycle',icon:'',name:'분리수거',desc:'재활용품 분리수거 인증 사진 업로드',pt:'+1,000P'},
    {type:'invite',icon:'',name:'친구 초대 & SNS 공유',desc:'친구 초대 또는 SNS 공유 인증 사진 업로드',pt:'+500P'},
    {type:'cap',icon:'',name:'병뚜껑 모으기',desc:'15개당 500P / 30개부터 키링 교환 가능',pt:'+500P~'},
  ]

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',maxWidth:'430px',margin:'0 auto',paddingBottom:'64px',fontFamily:'inherit'}}>
      <div style={{padding:'18px 20px 10px',position:'sticky',top:0,background:'#5DD85A',zIndex:10}}>
        <div style={{fontSize:'22px',fontWeight:900,color:'#111'}}><span style={{display:'flex',alignItems:'center',gap:'8px'}}><img src='/icon.png' style={{width:'28px',height:'28px',objectFit:'contain'}} /><span>미션</span></span></div>
      </div>

      <div style={{margin:'0 16px 16px',background:'#111',padding:'20px'}}>
        <div style={{fontSize:'13px',color:'#888',marginBottom:'4px',fontWeight:700}}>내 포인트</div>
        <div style={{fontSize:'36px',fontWeight:900,color:'#5DD85A'}}>{myPoints.toLocaleString()} P</div>
      </div>

      <div style={{padding:'0 16px 8px',fontSize:'13px',fontWeight:700,color:'#111',opacity:0.5}}>참여 가능한 미션</div>

      {missions.map(m=>(
        <div key={m.type} onClick={()=>setModal(m.type)} style={{background:'#fff',margin:'0 16px 10px',padding:'16px',display:'flex',alignItems:'center',gap:'14px',cursor:'pointer'}}>
          <div style={{width:'52px',height:'52px',background:'#111',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',flexShrink:0}}>{m.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'15px',fontWeight:700,color:'#111'}}>{m.name}</div>
            <div style={{fontSize:'12px',color:'#888',fontWeight:700}}>{m.desc}</div>
          </div>
          <div style={{fontSize:'14px',fontWeight:900,color:'#111'}}>{m.pt}</div>
        </div>
      ))}

      <div style={{padding:'8px 16px 8px',fontSize:'13px',fontWeight:700,color:'#111',opacity:0.5}}>나의 미션 현황</div>
      <div style={{background:'#fff',margin:'0 16px',padding:'14px 16px'}}>
        {myRequests.length === 0 && <div style={{fontSize:'13px',fontWeight:700,color:'#888',textAlign:'center',padding:'12px'}}>아직 참여한 미션이 없어요</div>}
        {myRequests.map(r=>(
          <div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #eee'}}>
            <span style={{fontSize:'13px',fontWeight:700,color:'#111'}}>
              {r.mission_type==='walk'?' 걷기':r.mission_type==='trash'?' 쓰레기 줍기':r.mission_type==='recycle'?' 분리수거':r.mission_type==='invite'?' 친구초대':' 병뚜껑'}
            </span>
            <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',background:statusBg(r.status),color:statusColor(r.status)}}>{statusLabel(r.status)}{r.status==='approved'?` +${r.points.toLocaleString()}P`:''}</span>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:50}}>
          <div style={{background:'#fff',width:'100%',maxWidth:'430px',padding:'20px',maxHeight:'85vh',overflowY:'auto'}}>
            <div style={{width:'40px',height:'4px',background:'#ddd',margin:'0 auto 16px'}}></div>
            <div style={{fontSize:'20px',fontWeight:900,color:'#111',marginBottom:'16px'}}>
              {missions.find(m=>m.type===modal)?.icon} {missions.find(m=>m.type===modal)?.name}
            </div>

            {modal==='walk' && (
              <div style={{marginBottom:'14px'}}>
                <div style={{fontSize:'13px',fontWeight:700,color:'#888',marginBottom:'4px'}}>오늘의 걸음 수</div>
                <div style={{fontSize:'32px',fontWeight:900,color:'#111'}}>{steps.toLocaleString()}보</div>
                <div style={{height:'8px',background:'#eee',margin:'8px 0 4px',overflow:'hidden'}}>
                  <div style={{height:'8px',background:'#111',width:`${Math.min(100,Math.round(steps/3000*100))}%`}}></div>
                </div>
                <div style={{fontSize:'12px',fontWeight:700,color:'#888'}}>목표: 3,000보 이상</div>
                <input type="range" min="0" max="10000" value={steps} onChange={e=>setSteps(parseInt(e.target.value))} style={{width:'100%',marginTop:'8px'}} />
              </div>
            )}

            {modal==='cap' && (
              <div style={{marginBottom:'14px'}}>
                <div style={{fontSize:'13px',fontWeight:700,color:'#111',marginBottom:'6px'}}>병뚜껑 개수</div>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                  <button onClick={()=>setCapCount(Math.max(15,capCount-1))} style={{...btn,width:'40px',padding:'8px',fontSize:'20px'}}>-</button>
                  <div style={{fontSize:'28px',fontWeight:900,color:'#111',flex:1,textAlign:'center'}}>{capCount}개</div>
                  <button onClick={()=>setCapCount(capCount+1)} style={{...btn,width:'40px',padding:'8px',fontSize:'20px'}}>+</button>
                </div>
                <div style={{background:'#f0f0f0',padding:'10px 14px',marginBottom:'10px'}}>
                  <div style={{fontSize:'13px',fontWeight:700,color:'#111'}}>
                    {capCount >= 30 ? `30개 이상 — 포인트 또는 키링 교환 선택 가능` : `15개 이상 — 500P 지급`}
                  </div>
                </div>
                {capCount >= 30 && (
                  <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
                    <button onClick={()=>setCapReward('point')} style={{flex:1,padding:'12px',fontWeight:700,fontSize:'14px',border:'2px solid #111',background:capReward==='point'?'#111':'#fff',color:capReward==='point'?'#fff':'#111',cursor:'pointer'}}>💰 1,000P 받기</button>
                    <button onClick={()=>setCapReward('keyring')} style={{flex:1,padding:'12px',fontWeight:700,fontSize:'14px',border:'2px solid #111',background:capReward==='keyring'?'#111':'#fff',color:capReward==='keyring'?'#fff':'#111',cursor:'pointer'}}> 키링 교환</button>
                  </div>
                )}
              </div>
            )}

            <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[e.target.files.length-1]||null)} style={{width:'100%',marginBottom:'12px',fontWeight:700}} />
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'13px',fontWeight:700,color:'#111',marginBottom:'4px'}}>한마디</div>
              <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="미션 인증 내용을 간단히 적어주세요" style={{width:'100%',border:'none',borderBottom:'2px solid #111',background:'transparent',padding:'8px 4px',fontSize:'14px',fontWeight:700,outline:'none',color:'#111'}} />
            </div>
            {modal==='invite' && <div style={{background:'#f0f0f0',padding:'10px 14px',marginBottom:'12px',fontSize:'12px',fontWeight:700,color:'#555'}}> 친구 초대 및 SNS 공유 인증은 피드에 게시되지 않아요</div>}
            <button onClick={handleUpload} disabled={uploading} style={{...btn,marginBottom:'8px'}}>{uploading?'업로드 중...':'업로드 및 포인트 신청'}</button>
            <button onClick={()=>setModal(null)} style={{...btn,background:'#fff',color:'#111',border:'2px solid #111'}}>취소</button>
          </div>
        </div>
      )}

      <div style={{background:'#111',display:'flex',position:'fixed',bottom:0,width:'100%',maxWidth:'430px'}}>
        {[['','피드','/feed'],['','미션','/mission'],['','상점','/shop'],['','마이','/my']].map(([icon,label,path])=>(
          <button key={path} onClick={()=>router.push(path as string)} style={{flex:1,padding:'12px 4px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',background:'none',border:'none',cursor:'pointer',color:path==='/mission'?'#5DD85A':'#666',fontSize:'10px',fontWeight:700}}>
            <span style={{fontSize:'20px'}}>{icon}</span>{label}
          </button>
        ))}
      </div>
    </main>
  )
}
