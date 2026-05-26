'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ShopPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [myPoints, setMyPoints] = useState(0)
  const [modal, setModal] = useState<any|null>(null)
  const [code, setCode] = useState('')
  const [qty, setQty] = useState(1)

  useEffect(() => {
    checkAuth()
    fetchProducts()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('points').eq('id', user.id).single()
    if (data) setMyPoints(data.points)
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*')
    if (data) setProducts(data)
  }

  async function handleOrder() {
    if (!code) { alert('로그인 코드를 입력해주세요'); return }
    const total = modal.price * qty
    if (myPoints < total) { alert('포인트가 부족합니다'); return }
    if (modal.stock - modal.sold < qty) { alert('재고가 부족합니다'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('orders').insert({ user_id: user.id, product_id: modal.id, quantity: qty, total_points: total })
    await supabase.from('products').update({ sold: modal.sold + qty }).eq('id', modal.id)
    await supabase.rpc('increment_points', { user_id: user.id, amount: -total })
    setMyPoints(prev => prev - total)
    setModal(null)
    setCode('')
    setQty(1)
    alert(`${modal.name} ${qty}개 구매 완료! 🎉`)
    fetchProducts()
  }

  const emoji = (name:string) => name.includes('머그') ? '☕' : '🫙'
  const btn:React.CSSProperties = {width:'100%',background:'#111',color:'#fff',border:'none',borderRadius:'0',padding:'16px',fontSize:'16px',fontWeight:700,cursor:'pointer'}
  const inputStyle:React.CSSProperties = {width:'100%',padding:'14px',border:'none',borderBottom:'2.5px solid #111',background:'transparent',fontSize:'16px',fontWeight:700,outline:'none',color:'#111'}

  return (
    <main style={{background:'#5DD85A',minHeight:'100vh',maxWidth:'430px',margin:'0 auto',paddingBottom:'64px',fontFamily:'inherit'}}>
      <div style={{padding:'18px 20px 10px',position:'sticky',top:0,background:'#5DD85A',zIndex:10}}>
        <div style={{fontSize:'22px',fontWeight:900,color:'#111'}}><span style={{display:'flex',alignItems:'center',gap:'8px'}}><img src='/icon.png' style={{width:'28px',height:'28px',objectFit:'contain'}} /><span>상점</span></span></div>
      </div>

      <div style={{margin:'0 16px 14px',background:'#111',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:'13px',fontWeight:700,color:'#888'}}>사용 가능 포인트</span>
        <span style={{fontSize:'20px',fontWeight:900,color:'#5DD85A'}}>{myPoints.toLocaleString()} P</span>
      </div>

      <div style={{padding:'0 16px 8px',fontSize:'13px',fontWeight:700,color:'#111',opacity:0.5}}>친환경 굿즈 스토어</div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',padding:'0 16px 16px'}}>
        {products.map(p => {
          const left = p.stock - p.sold
          const soldout = left <= 0
          return (
            <div key={p.id} onClick={()=>!soldout&&setModal(p)} style={{background:'#fff',cursor:soldout?'not-allowed':'pointer',opacity:soldout?0.55:1}}>
              <div style={{width:'100%',height:'140px',background:'#d4f0d2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'52px'}}>{emoji(p.name)}</div>
              <div style={{padding:'12px 14px'}}>
                <div style={{fontSize:'15px',fontWeight:900,color:'#111',marginBottom:'4px'}}>{p.name}</div>
                <div style={{fontSize:'13px',fontWeight:700,color:'#111'}}>{p.price.toLocaleString()}P</div>
                <div style={{fontSize:'12px',fontWeight:700,color:'#888'}}>잔여 {left}개</div>
                {soldout && <div style={{background:'#111',color:'#fff',fontSize:'11px',fontWeight:700,padding:'3px 8px',marginTop:'4px',display:'inline-block'}}>품절</div>}
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:50}}>
          <div style={{background:'#fff',width:'100%',maxWidth:'430px',padding:'20px',maxHeight:'85vh',overflowY:'auto'}}>
            <div style={{width:'40px',height:'4px',background:'#ddd',margin:'0 auto 16px'}}></div>
            <div style={{fontSize:'20px',fontWeight:900,color:'#111',marginBottom:'16px'}}>구매하기</div>
            <div style={{display:'flex',gap:'20px',alignItems:'flex-start',marginBottom:'20px'}}>
              <div style={{width:'100px',height:'100px',background:'#d4f0d2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'48px',flexShrink:0}}>{emoji(modal.name)}</div>
              <div>
                <div style={{fontSize:'22px',fontWeight:900,color:'#111',marginBottom:'4px'}}>{modal.name}</div>
                <div style={{fontSize:'16px',fontWeight:700,color:'#111'}}>{modal.price.toLocaleString()}P</div>
              </div>
            </div>
            <div style={{marginBottom:'14px'}}>
              <div style={{fontSize:'13px',fontWeight:700,color:'#111',marginBottom:'6px'}}>로그인 코드</div>
              <input value={code} onChange={e=>setCode(e.target.value)} placeholder="로그인 코드 입력" style={inputStyle} />
            </div>
            <div style={{marginBottom:'14px'}}>
              <div style={{fontSize:'13px',fontWeight:700,color:'#111',marginBottom:'6px'}}>구매 수량</div>
              <select value={qty} onChange={e=>setQty(parseInt(e.target.value))} style={inputStyle}>
                {[1,2,3].map(n=><option key={n} value={n}>{n}개</option>)}
              </select>
            </div>
            <div style={{background:'#5DD85A',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <span style={{fontSize:'13px',fontWeight:700,color:'#111'}}>보유 포인트</span>
              <span style={{fontSize:'16px',fontWeight:900,color:'#111'}}>{myPoints.toLocaleString()}P</span>
            </div>
            <button onClick={handleOrder} style={{...btn,marginBottom:'8px'}}>구매하기</button>
            <button onClick={()=>setModal(null)} style={{...btn,background:'#fff',color:'#111',border:'2px solid #111'}}>취소</button>
          </div>
        </div>
      )}

      <div style={{background:'#111',display:'flex',position:'fixed',bottom:0,width:'100%',maxWidth:'430px'}}>
        {[['🏠','피드','/feed'],['🎯','미션','/mission'],['🏆','랭킹','/ranking'],['🛍️','상점','/shop'],['👤','마이','/my']].map(([icon,label,path])=>(
          <button key={path} onClick={()=>router.push(path as string)} style={{flex:1,padding:'12px 4px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',background:'none',border:'none',cursor:'pointer',color:path==='/shop'?'#5DD85A':'#666',fontSize:'10px',fontWeight:700}}>
            <span style={{fontSize:'20px'}}>{icon}</span>{label}
          </button>
        ))}
      </div>
    </main>
  )
}
