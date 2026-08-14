import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import {
  Camera, MapPin, Search, Plus, Heart, MessageCircle, Bookmark,
  Share2, X, UserRound, LogIn, LogOut, Upload, Sun, CloudSun,
  Clock3, Navigation, Trophy, Compass, Menu, SlidersHorizontal,
  ChevronRight, Sparkles, ShieldCheck, Globe2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('YOUR_PROJECT'));
const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const seedPhotos = [
  {id:'seed-1', type:'famous', title:'Blue-hour Tower Bridge', location_name:'Tower Bridge', city:'London, UK', lat:51.5055, lng:-0.0754, photographer:'LensAtlas Archive', profile_name:'LensAtlas Archive', image_url:'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=85', camera:'Nikon D850', lens:'24–70mm', conditions:'Blue hour, light clouds', tags:['City','Blue hour'], description:'A classic riverside composition. Try the south bank and frame the bridge with the river reflections.', likes:842, comments:18},
  {id:'seed-2', type:'community', title:'London skyline from Primrose Hill', location_name:'Primrose Hill', city:'London, UK', lat:51.5393, lng:-0.1608, photographer:'Maya Chen', profile_name:'Maya Chen', image_url:'https://images.unsplash.com/photo-1520986606214-8b456906c813?auto=format&fit=crop&w=1200&q=85', camera:'Fujifilm X-T5', lens:'50mm', conditions:'Golden hour', tags:['Landscape','Sunset'], description:'Arrive about 30 minutes before sunset. The skyline opens up beautifully from the top.', likes:321, comments:12},
  {id:'seed-3', type:'famous', title:'Eiffel Tower from Trocadéro', location_name:'Eiffel Tower', city:'Paris, France', lat:48.8584, lng:2.2945, photographer:'LensAtlas Archive', profile_name:'LensAtlas Archive', image_url:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85', camera:'Leica Q3', lens:'28mm', conditions:'Sunrise', tags:['Architecture','Famous'], description:'The classic alignment is strongest early in the morning before the plaza gets busy.', likes:1120, comments:34},
  {id:'seed-4', type:'community', title:'Manhattan framed by the bridge', location_name:'Brooklyn Bridge', city:'New York, USA', lat:40.7061, lng:-73.9969, photographer:'Alex Rivera', profile_name:'Alex Rivera', image_url:'https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1200&q=85', camera:'Sony A7 IV', lens:'35mm', conditions:'Night, dry roads', tags:['City','Night'], description:'Head toward the Manhattan side of the pedestrian walkway for leading lines.', likes:567, comments:21},
  {id:'seed-5', type:'community', title:'Pagoda + Fuji', location_name:'Mount Fuji Chureito Pagoda', city:'Fujiyoshida, Japan', lat:35.4876, lng:138.7990, photographer:'Kei Tanaka', profile_name:'Kei Tanaka', image_url:'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85', camera:'Canon R5', lens:'70–200mm', conditions:'Clear morning', tags:['Landscape','Mountain'], description:'One of the most recognizable compositions in Japan. Spring and autumn are especially photogenic.', likes:889, comments:15},
  {id:'seed-6', type:'community', title:'Fog rolling under Golden Gate', location_name:'Golden Gate Bridge', city:'San Francisco, USA', lat:37.8199, lng:-122.4783, photographer:'Noah Brooks', profile_name:'Noah Brooks', image_url:'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=85', camera:'Sony A7R V', lens:'85mm', conditions:'Morning fog', tags:['Fog','Landscape'], description:'Check the fog forecast before you go. The view can change dramatically in 10 minutes.', likes:733, comments:17},
  {id:'seed-7', type:'famous', title:'Oia at sunset', location_name:'Santorini', city:'Oia, Greece', lat:36.4618, lng:25.3753, photographer:'LensAtlas Archive', profile_name:'LensAtlas Archive', image_url:'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=85', camera:'Hasselblad X2D', lens:'45mm', conditions:'Sunset, clear', tags:['Sunset','Travel'], description:'Iconic viewpoint, but there are many quieter side streets that give you more original foregrounds.', likes:980, comments:29},
  {id:'seed-8', type:'community', title:'Turquoise reflections', location_name:'Lake Louise', city:'Alberta, Canada', lat:51.4254, lng:-116.1773, photographer:'Emma Laurent', profile_name:'Emma Laurent', image_url:'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85', camera:'Nikon Z8', lens:'24–120mm', conditions:'Early morning', tags:['Lake','Mountain'], description:'Calm water makes reflections much cleaner. A polarizer can help, but reduce it when you want reflection detail.', likes:402, comments:11}
];

function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function getLocal(key, fallback){ try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback} }
function setLocal(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

async function geocode(q){
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`, {headers:{'Accept-Language':'en'}});
  const data = await r.json();
  if(!data?.[0]) throw new Error('Location not found');
  return {lat:Number(data[0].lat), lng:Number(data[0].lon), display:data[0].display_name};
}

function MapView({photos,onSelect}){
  const [mapEl,setMapEl]=useState(null);
  useEffect(()=>{
    if(!mapEl) return;
    const map=L.map(mapEl,{worldCopyJump:true,minZoom:2,zoomControl:true}).setView([30,5],2.3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
    const markers=[];
    const icon=(p)=>L.divIcon({className:'photo-marker',html:`<div class="marker-dot ${p.type}"></div>`,iconSize:[22,22],iconAnchor:[11,11]});
    photos.forEach(p=>{
      const m=L.marker([p.lat,p.lng],{icon:icon(p)}).addTo(map);
      m.on('click',()=>{onSelect(p); map.flyTo([p.lat,p.lng],12,{duration:.6});}); markers.push(m);
    });
    return ()=>map.remove();
  },[mapEl,photos,onSelect]);
  return <div ref={setMapEl} className="map"/>;
}

function AuthModal({onClose,onAuth}){
  const [mode,setMode]=useState('login'); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState(''); const [status,setStatus]=useState(''); const [busy,setBusy]=useState(false);
  async function submit(e){
    e.preventDefault(); setBusy(true); setStatus('');
    try{
      if(!hasSupabase){
        const user={id:'demo-user',email,name:name||email.split('@')[0]||'Ronan',username:(name||email.split('@')[0]||'ronan').toLowerCase().replace(/\W/g,''),avatar_url:''};
        setLocal('lensatlas_user',user); onAuth(user); onClose(); return;
      }
      if(mode==='signup'){
        const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name||email.split('@')[0]}}}); if(error)throw error; setStatus('Check your email to confirm your account.'); if(data.user) onAuth(data.user);
      }else{ const {data,error}=await supabase.auth.signInWithPassword({email,password}); if(error)throw error; onAuth(data.user); onClose(); }
    }catch(err){setStatus(err.message)} finally{setBusy(false)}
  }
  return <div className="modal-backdrop"><div className="modal-card auth-card"><button className="icon-button close-button" onClick={onClose}><X size={18}/></button><div className="modal-title"><div className="brand-mark small">LA</div><div><h2>{mode==='login'?'Welcome back':'Join LensAtlas'}</h2><p>{hasSupabase?'Your real account will sync across devices.':'Demo mode: no account service configured yet.'}</p></div></div><form onSubmit={submit} className="stack">{mode==='signup'&&<label>Display name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Ronan Photography" required/></label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></label>{status&&<div className="notice">{status}</div>}<button className="btn primary full" disabled={busy}>{busy?'Working…':mode==='login'?'Log in':'Create account'}</button></form><button className="link-button" onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?"Don't have an account? Sign up":"Already have an account? Log in"}</button></div></div>
}

function UploadModal({user,onClose,onCreated}){
  const [file,setFile]=useState(null),[preview,setPreview]=useState(''),[location,setLocation]=useState(''),[title,setTitle]=useState(''),[camera,setCamera]=useState(''),[lens,setLens]=useState(''),[conditions,setConditions]=useState(''),[description,setDescription]=useState(''),[lat,setLat]=useState(''),[lng,setLng]=useState(''),[privacy,setPrivacy]=useState('exact'),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
  function choose(e){const f=e.target.files?.[0]; if(!f)return; setFile(f); setPreview(URL.createObjectURL(f));}
  async function submit(e){
    e.preventDefault(); if(!file||!location)return setStatus('Add a photo and a location.'); setBusy(true); setStatus('Locating…');
    try{
      let coords={lat:Number(lat),lng:Number(lng)};
      if(!coords.lat||!coords.lng) coords=await geocode(location);
      let photo={id:uid(),type:'community',title:title||location.split(',')[0],location_name:location.split(',')[0],city:location,lat:coords.lat,lng:coords.lng,photographer:user?.name||'Ronan',profile_name:user?.name||'Ronan',image_url:preview,camera,lens,conditions:conditions||'Not specified',tags:['Community'],description:description||'Shared by The Lens Atlas community.',likes:0,comments:0,privacy};
      if(hasSupabase && user?.id && user.id!=='demo-user'){
        const path=`${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
        const upload=await supabase.storage.from('photos').upload(path,file,{upsert:false,contentType:file.type}); if(upload.error) throw upload.error;
        const publicUrl=supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
        const {data,error}=await supabase.from('photos').insert({user_id:user.id,title:photo.title,description:photo.description,location_name:photo.location_name,city:photo.city,latitude:photo.lat,longitude:photo.lng,image_url:publicUrl,camera:camera||null,lens:lens||null,conditions:photo.conditions,tags:photo.tags,location_precision:privacy}).select().single(); if(error)throw error; photo=data;
      } else { const arr=getLocal('lensatlas_photos',[]); arr.unshift(photo); setLocal('lensatlas_photos',arr); }
      onCreated(photo); onClose();
    }catch(err){setStatus(err.message||'Could not publish this photo.')} finally{setBusy(false)}
  }
  return <div className="modal-backdrop"><div className="modal-card wide"><button className="icon-button close-button" onClick={onClose}><X size={18}/></button><div className="modal-title"><Upload size={22}/><div><h2>Post a photo</h2><p>Place it on the map and give other photographers useful details.</p></div></div><form onSubmit={submit} className="form-grid"><div className="field full"><label>Photo</label><label className="upload-zone">{preview?<img src={preview} className="upload-preview"/>:<><Upload size={28}/><span>Choose a JPG, PNG, or WebP</span></>}<input type="file" accept="image/*" onChange={choose} hidden/><button type="button" className="btn secondary" onClick={()=>document.querySelector('.upload-zone input')?.click()}>Choose image</button></label></div><label className="field">Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Golden hour at the bridge" /></label><label className="field">Location<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Tower Bridge, London" required /></label><label className="field">Camera<input value={camera} onChange={e=>setCamera(e.target.value)} placeholder="Sony A7 IV" /></label><label className="field">Lens<input value={lens} onChange={e=>setLens(e.target.value)} placeholder="24–70mm" /></label><label className="field">Best conditions<input value={conditions} onChange={e=>setConditions(e.target.value)} placeholder="Golden hour, light clouds" /></label><label className="field">Location precision<select value={privacy} onChange={e=>setPrivacy(e.target.value)}><option value="exact">Exact</option><option value="approximate">Approximate</option><option value="hidden">Hide on map</option></select></label><label className="field full">Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tell other photographers what makes this spot good…" /></label>{status&&<div className="notice full">{status}</div>}<div className="modal-actions full"><button type="button" className="btn secondary" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy?'Publishing…':'Publish photo'}</button></div></form></div></div>
}

function SpotPanel({photo,onClose,onSave,saved,onLike}){ if(!photo)return null; return <aside className="spot-panel"><div className="spot-image-wrap"><img src={photo.image_url}/><button className="icon-button image-close" onClick={onClose}><X size={18}/></button><div className="type-badge"><span className={`badge-dot ${photo.type}`}></span>{photo.type==='famous'?'Famous photo':'Community photo'}</div></div><div className="spot-body"><h2>{photo.location_name}</h2><p className="location-line"><MapPin size={14}/>{photo.city}</p><div className="chips">{(photo.tags||[]).map(t=><span key={t} className="chip">{t}</span>)}</div><div className="shot-grid"><div><Camera size={15}/><b>{photo.camera||'Not listed'}</b><span>Camera</span></div><div><Compass size={15}/><b>{photo.lens||'Not listed'}</b><span>Lens</span></div><div><Sun size={15}/><b>{photo.conditions||'Any'}</b><span>Best conditions</span></div><div><UserRound size={15}/><b>{photo.photographer||'Anonymous'}</b><span>Photographer</span></div></div><p className="story">{photo.description||'A LensAtlas photography spot.'}</p><div className="social-row"><button className="social-button" onClick={()=>onLike(photo)}><Heart size={16}/>{photo.likes||0}</button><button className="social-button"><MessageCircle size={16}/>{photo.comments||0}</button><button className={`social-button ${saved?'selected':''}`} onClick={()=>onSave(photo.id)}><Bookmark size={16}/>{saved?'Saved':'Save spot'}</button><button className="social-button" onClick={()=>navigator.clipboard?.writeText(location.href)}><Share2 size={16}/></button></div><button className="btn primary full" onClick={()=>onSave(photo.id)}><Compass size={17}/>Shoot this location</button>{photo.type==='famous'&&<div className="famous-note"><Trophy size={16}/><div><b>Famous photography</b><span>Use the location as inspiration, then create your own version. Images in the archive should be properly credited and licensed.</span></div></div>}</div></aside> }

function ProfilePanel({user,onClose,photos,onLogout,onLogin}){ if(!user)return null; const mine=photos.filter(p=>p.photographer===user.name); return <div className="profile-overlay"><div className="profile-sheet"><button className="icon-button" onClick={onClose}><X size={18}/></button><div className="profile-head"><div className="big-avatar">{(user.name||'R').slice(0,1).toUpperCase()}</div><div><h2>{user.name||user.email?.split('@')[0]||'Photographer'}</h2><p>@{user.username||'lensatlas'}</p></div><button className="btn secondary" onClick={user.id==='demo-user'?onLogout:async()=>{await supabase?.auth.signOut(); onLogout();}}><LogOut size={16}/>Log out</button></div><div className="profile-stats"><div><b>{mine.length}</b><span>photos</span></div><div><b>12</b><span>saved spots</span></div><div><b>0</b><span>followers</span></div></div><div className="profile-grid">{mine.map(p=><img key={p.id} src={p.image_url}/>)}</div><div className="profile-foot"><ShieldCheck size={16}/>Your account is ready for follows, likes, comments, and cloud photo storage once Supabase is connected.</div></div></div> }

function App(){
  const [photos,setPhotos]=useState(()=>[...seedPhotos,...getLocal('lensatlas_photos',[])]);
  const [filter,setFilter]=useState('all'); const [query,setQuery]=useState(''); const [selected,setSelected]=useState(null); const [saved,setSaved]=useState(()=>new Set(getLocal('lensatlas_saved',[]))); const [liked,setLiked]=useState(()=>new Set(getLocal('lensatlas_liked',[]))); const [showUpload,setShowUpload]=useState(false); const [showAuth,setShowAuth]=useState(false); const [user,setUser]=useState(()=>getLocal('lensatlas_user',null)); const [showProfile,setShowProfile]=useState(false); const [mobileOpen,setMobileOpen]=useState(false);
  useEffect(()=>{
    if(!hasSupabase) return;
    supabase.auth.getSession().then(({data})=>{ if(data.session?.user) setUser(data.session.user); });
    const {data:sub}=supabase.auth.onAuthStateChange((_e,session)=>setUser(session?.user||null)); return ()=>sub.subscription.unsubscribe();
  },[]);
  useEffect(()=>{ if(hasSupabase){ supabase.from('photos_view').select('*').order('created_at',{ascending:false}).limit(1000).then(({data})=>{if(data?.length)setPhotos(data)}) }},[]);
  const visible=useMemo(()=>photos.filter(p=>{
    const f=filter==='all'||p.type===filter||(filter==='saved'&&saved.has(p.id)); const q=`${p.title} ${p.location_name} ${p.city} ${p.photographer}`.toLowerCase(); return f && q.includes(query.toLowerCase().trim());
  }),[photos,filter,query,saved]);
  function toggleSave(id){const next=new Set(saved); next.has(id)?next.delete(id):next.add(id);setSaved(next);setLocal('lensatlas_saved',[...next]);}
  async function toggleLike(p){const next=new Set(liked); if(next.has(p.id))next.delete(p.id); else next.add(p.id); setLiked(next); setLocal('lensatlas_liked',[...next]); setPhotos(prev=>prev.map(x=>x.id===p.id?{...x,likes:Math.max(0,(x.likes||0)+(next.has(p.id)?1:-1))}:x)); if(hasSupabase&&user?.id&&user.id!=='demo-user'){ if(next.has(p.id)) await supabase.from('likes').insert({user_id:user.id,photo_id:p.id}); else await supabase.from('likes').delete().eq('user_id',user.id).eq('photo_id',p.id); }}
  function onCreated(p){setPhotos(prev=>[p,...prev]);}
  const trending=[...photos].sort((a,b)=>(b.likes||0)-(a.likes||0)).slice(0,5);
  return <div className="app"><header className="topbar"><button className="icon-button mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)}><Menu size={20}/></button><div className="brand"><div className="brand-mark">LA</div><div><b>The Lens Atlas</b><span>Photography on the map</span></div></div><div className="top-actions"><button className="btn secondary help" onClick={()=>alert('Explore the map, click a pin, save a spot, and post your own photos. Connect Supabase to turn this into a real multi-user service.')}>How it works</button><button className="btn primary" onClick={()=>user?setShowUpload(true):setShowAuth(true)}><Plus size={17}/>Post a photo</button>{user?<button className="avatar-button" onClick={()=>setShowProfile(true)}>{(user.name||user.email||'R').slice(0,1).toUpperCase()}</button>:<button className="btn secondary" onClick={()=>setShowAuth(true)}><LogIn size={17}/>Log in</button>}</div></header>
    <aside className={`sidebar ${mobileOpen?'open':''}`}><div className="search-wrap"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search cities, landmarks, photographers…"/></div><div className="sidebar-section"><div className="section-title"><span>Explore</span><SlidersHorizontal size={15}/></div><div className="filter-grid">{[['all','All photos'],['community','Community'],['famous','Famous'],['saved','Saved spots']].map(([k,l])=><button key={k} className={`filter-btn ${filter===k?'active':''}`} onClick={()=>{setFilter(k);setMobileOpen(false)}}>{l}</button>)}</div></div><div className="sidebar-section"><div className="section-title">Atlas stats</div><div className="stat-grid"><div className="stat-card"><b>{photos.length}</b><span>photos</span></div><div className="stat-card"><b>{new Set(photos.map(p=>p.location_name)).size}</b><span>spots</span></div></div></div><div className="sidebar-section"><div className="section-title">Trending spots <Sparkles size={15}/></div><div className="mini-list">{trending.map(p=><button className="mini-card" key={p.id} onClick={()=>setSelected(p)}><img src={p.image_url}/><span><b>{p.location_name}</b><small>{p.photographer} · {p.likes||0} likes</small></span><ChevronRight size={14}/></button>)}</div></div><div className="sidebar-section"><div className="section-title">Your account</div>{user?<button className="account-card" onClick={()=>setShowProfile(true)}><div className="big-avatar mini">{(user.name||user.email||'R').slice(0,1).toUpperCase()}</div><span><b>{user.name||user.email}</b><small>Open profile</small></span><ChevronRight size={16}/></button>:<button className="account-card" onClick={()=>setShowAuth(true)}><div className="big-avatar mini"><UserRound size={17}/></div><span><b>Join LensAtlas</b><small>Create a photographer profile</small></span><ChevronRight size={16}/></button>}</div><div className="sidebar-foot"><Globe2 size={15}/>Map data © OpenStreetMap contributors</div></aside>
    <main className="map-wrap"><div className="map-card"><div><span className="eyebrow"><Compass size={14}/>EXPLORE THE ATLAS</span><h1>Find where great photos happen.</h1><p>{visible.length} mapped photos across the world.</p></div><div className="map-chips"><span className="legend-pill"><i className="legend-dot community"></i>Community</span><span className="legend-pill"><i className="legend-dot famous"></i>Famous</span><span className="legend-pill"><i className="legend-dot saved"></i>Saved</span></div></div><MapView photos={visible} onSelect={setSelected}/><div className="map-bottom-card"><div><b>Plan your next shoot</b><span>Save locations and build your personal shooting list.</span></div>{user?<button className="btn secondary" onClick={()=>alert(`You have ${saved.size} saved spot${saved.size===1?'':'s'}.`)}>Open saved list</button>:<button className="btn primary" onClick={()=>setShowAuth(true)}>Create profile</button>}</div>{selected&&<SpotPanel photo={selected} onClose={()=>setSelected(null)} onSave={toggleSave} saved={saved.has(selected.id)} onLike={toggleLike}/>}</main>
    {showUpload&&<UploadModal user={user} onClose={()=>setShowUpload(false)} onCreated={onCreated}/>} {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onAuth={u=>{setUser(u);setLocal('lensatlas_user',u)}}/>} {showProfile&&<ProfilePanel user={user} onClose={()=>setShowProfile(false)} photos={photos} onLogout={()=>{setUser(null);localStorage.removeItem('lensatlas_user');setShowProfile(false)}} onLogin={()=>setShowAuth(true)}/>}<div className="mode-pill">{hasSupabase?<><ShieldCheck size={14}/>Live cloud mode</>:<><Camera size={14}/>Demo mode</>}</div>
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);
